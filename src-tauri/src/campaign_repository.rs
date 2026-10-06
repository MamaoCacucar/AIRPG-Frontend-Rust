use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::Read;
use std::path::{Path, PathBuf};
use zip::ZipArchive;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Campaign {
    pub id: String,
    pub title: String,
    pub poster_images: Vec<String>,
    pub banner_images: Vec<String>,
    pub tags: Vec<String>,
    pub path: String,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub missing_fields: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct CampaignFile {
    campaign: CampaignDetails,
}

#[derive(Debug, Deserialize)]
struct CampaignDetails {
    title: String,
    tags: Option<Vec<String>>,
}

pub struct CampaignRepository {
    campaigns_dir: PathBuf,
    secret_campaigns_dir: PathBuf,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignImage {
    pub bytes: Vec<u8>,
    pub content_type: String,
}

impl CampaignRepository {
    pub fn from_env() -> Result<Self, String> {
        Self::load_dotenv()?;

        let campaigns_dir = std::env::var_os("CAMPAIGNS_DIR")
            .map(PathBuf::from)
            .ok_or_else(|| "A variável de ambiente CAMPAIGNS_DIR não está definida".to_string())?;

        let secret_campaigns_dir = std::env::var_os("SECRET_CAMPAIGNS_DIR")
            .map(PathBuf::from)
            .ok_or_else(|| {
                "A variável de ambiente SECRET_CAMPAIGNS_DIR não está definida".to_string()
            })?;

        Ok(Self {
            campaigns_dir,
            secret_campaigns_dir,
        })
    }

    fn load_dotenv() -> Result<(), String> {
        let current_dir = std::env::current_dir()
            .map_err(|error| format!("Não foi possível obter a pasta atual: {error}"))?;
        let env_path = current_dir.join(".env");
        let env_path = if env_path.is_file() {
            Some(env_path)
        } else {
            current_dir
                .parent()
                .map(|parent| parent.join(".env"))
                .filter(|path| path.is_file())
        };

        if let Some(env_path) = env_path {
            dotenvy::from_path(&env_path).map_err(|error| {
                format!(
                    "Não foi possível carregar as variáveis do arquivo '{}': {error}",
                    env_path.display()
                )
            })?;
        }

        Ok(())
    }

    pub fn get_campaigns(&self) -> Result<Vec<Campaign>, String> {
        self.read_campaigns_from(&self.campaigns_dir, "campaigns")
    }

    pub fn get_secret_campaigns(&self) -> Result<Vec<Campaign>, String> {
        self.read_campaigns_from(&self.secret_campaigns_dir, "secret")
    }

    fn read_campaigns_from(
        &self,
        directory: &Path,
        image_root: &str,
    ) -> Result<Vec<Campaign>, String> {
        let entries = fs::read_dir(directory).map_err(|error| {
            format!(
                "Não foi possível ler a pasta de campanhas '{}': {error}",
                directory.display()
            )
        })?;
        let mut campaign_paths = Vec::new();

        for entry in entries {
            let entry = entry.map_err(|error| {
                format!(
                    "Não foi possível listar a pasta de campanhas '{}': {error}",
                    directory.display()
                )
            })?;
            let path = entry.path();

            if path.is_file()
                && path
                    .extension()
                    .and_then(|extension| extension.to_str())
                    .is_some_and(|extension| extension.eq_ignore_ascii_case("airpg"))
            {
                campaign_paths.push(path);
            }
        }

        campaign_paths.sort();
        let mut campaigns = Vec::new();
        for path in campaign_paths {
            let campaign: Result<Campaign, String> = (|| {
                let id = path
                    .file_stem()
                    .and_then(|file_stem| file_stem.to_str())
                    .ok_or_else(|| {
                        format!(
                            "Não foi possível obter o nome do arquivo de campanha '{}'",
                            path.display()
                        )
                    })?
                    .to_string();
                let archive_reference = path
                    .strip_prefix(directory)
                    .map_err(|error| {
                        format!(
                            "Não foi possível obter o caminho relativo da campanha '{}': {error}",
                            path.display()
                        )
                    })?
                    .to_str()
                    .ok_or_else(|| {
                        format!("O caminho da campanha não é UTF-8: '{}'", path.display())
                    })?
                    .to_string();
                let file_handle = File::open(&path).map_err(|error| {
                    format!(
                        "Não foi possível abrir o arquivo de campanha '{}': {error}",
                        path.display()
                    )
                })?;
                let mut archive = ZipArchive::new(file_handle).map_err(|error| {
                    format!(
                        "Arquivo de campanha ZIP inválido '{}': {error}",
                        path.display()
                    )
                })?;
                let json_entry_name = campaign_json_entry_name(&mut archive).map_err(|error| {
                    format!("Arquivo de campanha inválido '{}': {error}", path.display())
                })?;
                let contents =
                    read_zip_entry_to_string(&mut archive, &json_entry_name).map_err(|error| {
                        format!(
                            "Não foi possível ler '{}' em '{}': {error}",
                            json_entry_name,
                            path.display()
                        )
                    })?;
                let file: CampaignFile = serde_json::from_str(&contents).map_err(|error| {
                    format!(
                        "JSON inválido em '{}' de '{}': {error}",
                        json_entry_name,
                        path.display()
                    )
                })?;
                let mut missing_fields = Vec::new();
                if file.campaign.tags.is_none() {
                    missing_fields.push("tags".to_string());
                }
                let (poster_images, banner_images) =
                    campaign_images(&mut archive, image_root, &archive_reference, &path)?;

                Ok(Campaign {
                    id,
                    title: file.campaign.title,
                    poster_images,
                    banner_images,
                    tags: file.campaign.tags.unwrap_or_default(),
                    path: path.display().to_string(),
                    missing_fields,
                })
            })();

            match campaign {
                Ok(campaign) => campaigns.push(campaign),
                Err(error) => eprintln!("{error}"),
            }
        }

        Ok(campaigns)
    }

    pub fn validate_campaign_path(&self, campaign_path: &str) -> Result<PathBuf, String> {
        let campaigns_dir = fs::canonicalize(&self.campaigns_dir).map_err(|error| {
            format!(
                "Não foi possível acessar a pasta de campanhas '{}': {error}",
                self.campaigns_dir.display()
            )
        })?;
        let secret_campaigns_dir =
            fs::canonicalize(&self.secret_campaigns_dir).map_err(|error| {
                format!(
                    "Não foi possível acessar a pasta de campanhas secretas '{}': {error}",
                    self.secret_campaigns_dir.display()
                )
            })?;
        let campaign_path = fs::canonicalize(campaign_path)
            .map_err(|error| format!("Não foi possível acessar o arquivo da campanha: {error}"))?;

        let is_airpg = campaign_path
            .extension()
            .and_then(|extension| extension.to_str())
            .is_some_and(|extension| extension.eq_ignore_ascii_case("airpg"));
        let is_in_configured_directory = campaign_path.starts_with(&campaigns_dir)
            || campaign_path.starts_with(&secret_campaigns_dir);
        if !is_in_configured_directory || !is_airpg {
            return Err(
                "O arquivo da campanha precisa ser um ZIP .airpg dentro de CAMPAIGNS_DIR ou SECRET_CAMPAIGNS_DIR"
                    .into(),
            );
        }

        if !campaign_path.is_file() {
            return Err("O caminho informado não é um arquivo de campanha".into());
        }

        Ok(campaign_path)
    }

    pub fn read_campaign_json(&self, campaign_path: &Path) -> Result<Vec<u8>, String> {
        let file = File::open(campaign_path).map_err(|error| {
            format!(
                "Não foi possível abrir o arquivo da campanha '{}': {error}",
                campaign_path.display()
            )
        })?;
        let mut archive = ZipArchive::new(file).map_err(|error| {
            format!(
                "Arquivo de campanha ZIP inválido '{}': {error}",
                campaign_path.display()
            )
        })?;
        let entry_name = campaign_json_entry_name(&mut archive).map_err(|error| {
            format!(
                "Arquivo de campanha inválido '{}': {error}",
                campaign_path.display()
            )
        })?;
        let mut entry = archive.by_name(&entry_name).map_err(|error| {
            format!(
                "Não foi possível acessar '{}' em '{}': {error}",
                entry_name,
                campaign_path.display()
            )
        })?;
        let mut bytes = Vec::new();
        entry.read_to_end(&mut bytes).map_err(|error| {
            format!(
                "Não foi possível extrair '{}' de '{}': {error}",
                entry_name,
                campaign_path.display()
            )
        })?;
        Ok(bytes)
    }

    pub fn read_campaign_image(&self, image_path: &str) -> Result<CampaignImage, String> {
        let mut image_parts = image_path.splitn(3, "::");
        if let (Some(image_root), Some(archive_reference), Some(entry_name)) =
            (image_parts.next(), image_parts.next(), image_parts.next())
        {
            if matches!(image_root, "campaigns" | "secret") {
                return self.read_campaign_archive_image(image_root, archive_reference, entry_name);
            }
        }

        let campaigns_dir = fs::canonicalize(&self.campaigns_dir).map_err(|error| {
            format!(
                "Não foi possível acessar a pasta de campanhas '{}': {error}",
                self.campaigns_dir.display()
            )
        })?;
        let requested_path = Path::new(image_path);
        let image_path = if requested_path.is_absolute() {
            requested_path.to_path_buf()
        } else {
            campaigns_dir.join(requested_path)
        };
        let image_path = fs::canonicalize(&image_path).map_err(|error| {
            format!(
                "Não foi possível acessar a imagem da campanha '{}': {error}",
                image_path.display()
            )
        })?;

        if !image_path.starts_with(&campaigns_dir) {
            return Err("A imagem da campanha precisa estar dentro da pasta de campanhas".into());
        }

        let content_type = image_content_type(&image_path)?;

        let bytes = fs::read(&image_path).map_err(|error| {
            format!(
                "Não foi possível ler a imagem da campanha '{}': {error}",
                image_path.display()
            )
        })?;

        Ok(CampaignImage {
            bytes,
            content_type: content_type.into(),
        })
    }

    fn read_campaign_archive_image(
        &self,
        image_root: &str,
        archive_reference: &str,
        entry_name: &str,
    ) -> Result<CampaignImage, String> {
        let configured_root = match image_root {
            "campaigns" => &self.campaigns_dir,
            "secret" => &self.secret_campaigns_dir,
            _ => return Err("A origem da imagem da campanha é inválida".into()),
        };
        let campaigns_dir = fs::canonicalize(configured_root).map_err(|error| {
            format!(
                "Não foi possível acessar a pasta de campanhas '{}': {error}",
                configured_root.display()
            )
        })?;
        let requested_archive = Path::new(archive_reference);
        if requested_archive.is_absolute()
            || requested_archive
                .components()
                .any(|component| !matches!(component, std::path::Component::Normal(_)))
        {
            return Err(
                "O caminho da campanha para a imagem precisa ser relativo à pasta de campanhas"
                    .into(),
            );
        }
        let archive_path = fs::canonicalize(campaigns_dir.join(requested_archive))
            .map_err(|error| format!("Não foi possível acessar o arquivo da campanha: {error}"))?;
        if !archive_path.starts_with(&campaigns_dir)
            || !archive_path
                .extension()
                .and_then(|extension| extension.to_str())
                .is_some_and(|extension| extension.eq_ignore_ascii_case("airpg"))
        {
            return Err(
                "O arquivo da imagem precisa ser um ZIP .airpg dentro da pasta de campanhas".into(),
            );
        }

        let image_name = entry_name.strip_prefix("images/").ok_or_else(|| {
            "O caminho da imagem precisa estar dentro da pasta images do arquivo .airpg".to_string()
        })?;
        if image_name.is_empty() || image_name.contains('/') || image_name.contains('\\') {
            return Err("O caminho da imagem no arquivo .airpg é inválido".into());
        }
        let content_type = image_content_type(Path::new(image_name))?;

        let file = File::open(&archive_path).map_err(|error| {
            format!(
                "Não foi possível abrir o arquivo da campanha '{}': {error}",
                archive_path.display()
            )
        })?;
        let mut archive = ZipArchive::new(file).map_err(|error| {
            format!(
                "Arquivo de campanha ZIP inválido '{}': {error}",
                archive_path.display()
            )
        })?;
        let mut entry = archive.by_name(entry_name).map_err(|error| {
            format!(
                "Não foi possível acessar a imagem '{}' em '{}': {error}",
                entry_name,
                archive_path.display()
            )
        })?;
        let mut bytes = Vec::new();
        entry.read_to_end(&mut bytes).map_err(|error| {
            format!(
                "Não foi possível ler a imagem '{}' em '{}': {error}",
                entry_name,
                archive_path.display()
            )
        })?;

        Ok(CampaignImage {
            bytes,
            content_type: content_type.into(),
        })
    }
}

fn read_zip_entry_to_string<R: Read + std::io::Seek>(
    archive: &mut ZipArchive<R>,
    entry_name: &str,
) -> Result<String, String> {
    let mut entry = archive
        .by_name(entry_name)
        .map_err(|error| format!("Entrada '{entry_name}' não encontrada: {error}"))?;
    let mut contents = String::new();
    entry
        .read_to_string(&mut contents)
        .map_err(|error| format!("Não foi possível ler '{entry_name}': {error}"))?;
    Ok(contents)
}

fn campaign_json_entry_name<R: Read + std::io::Seek>(
    archive: &mut ZipArchive<R>,
) -> Result<String, String> {
    let mut root_json_names = Vec::new();
    for index in 0..archive.len() {
        let entry = archive
            .by_index(index)
            .map_err(|error| format!("Não foi possível listar o conteúdo do ZIP: {error}"))?;
        let name = entry.name();
        if entry.is_dir() || name.contains('/') || name.contains('\\') {
            continue;
        }
        if Path::new(name)
            .extension()
            .and_then(|extension| extension.to_str())
            .is_some_and(|extension| extension.eq_ignore_ascii_case("json"))
        {
            root_json_names.push(name.to_string());
        }
    }

    match root_json_names.as_slice() {
        [name] => Ok(name.clone()),
        [] => Err("não foi encontrado nenhum arquivo .json na raiz do ZIP".into()),
        _ => Err(format!(
            "foi encontrado mais de um arquivo .json na raiz do ZIP: {}",
            root_json_names.join(", ")
        )),
    }
}

fn campaign_images(
    archive: &mut ZipArchive<File>,
    image_root: &str,
    archive_reference: &str,
    archive_path: &Path,
) -> Result<(Vec<String>, Vec<String>), String> {
    let mut posters = Vec::new();
    let mut banners = Vec::new();
    for index in 0..archive.len() {
        let entry = archive.by_index(index).map_err(|error| {
            format!(
                "Não foi possível listar as imagens em '{}': {error}",
                archive_path.display()
            )
        })?;
        let Some(image_name) = entry.name().strip_prefix("images/") else {
            continue;
        };
        if entry.is_dir()
            || image_name.is_empty()
            || image_name.contains('/')
            || image_name.contains('\\')
            || image_content_type(Path::new(image_name)).is_err()
        {
            continue;
        }
        let normalized_name = image_name.to_ascii_lowercase();
        let target = if normalized_name.starts_with("poster") {
            Some(&mut posters)
        } else if normalized_name.starts_with("banner") {
            Some(&mut banners)
        } else {
            None
        };
        if let Some(images) = target {
            images.push(format!(
                "{image_root}::{archive_reference}::{}",
                entry.name()
            ));
        }
    }
    posters.sort_by_key(|image| campaign_image_sort_key(image));
    banners.sort_by_key(|image| campaign_image_sort_key(image));
    Ok((posters, banners))
}

fn campaign_image_sort_key(image: &str) -> (String, u64, String, String) {
    let file_name = image
        .rsplit("::")
        .next()
        .and_then(|entry| entry.strip_prefix("images/"))
        .unwrap_or(image);
    let path = Path::new(file_name);
    let stem = path
        .file_stem()
        .and_then(|stem| stem.to_str())
        .unwrap_or(file_name);
    let extension = path
        .extension()
        .and_then(|extension| extension.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();
    if let Some((prefix, number)) = stem.rsplit_once('_') {
        if let Ok(number) = number.parse::<u64>() {
            return (
                prefix.to_ascii_lowercase(),
                number,
                stem.to_ascii_lowercase(),
                extension,
            );
        }
    }
    (
        stem.to_ascii_lowercase(),
        0,
        stem.to_ascii_lowercase(),
        extension,
    )
}

fn image_content_type(path: &Path) -> Result<&'static str, String> {
    match path
        .extension()
        .and_then(|extension| extension.to_str())
        .map(str::to_ascii_lowercase)
        .as_deref()
    {
        Some("png") => Ok("image/png"),
        Some("jpg" | "jpeg") => Ok("image/jpeg"),
        Some("webp") => Ok("image/webp"),
        Some("gif") => Ok("image/gif"),
        Some("bmp") => Ok("image/bmp"),
        Some(extension) => Err(format!("Formato de imagem não suportado: .{extension}")),
        None => Err("A imagem não possui extensão".into()),
    }
}

#[cfg(test)]
mod tests {
    use super::CampaignRepository;
    use std::fs::{self, File};
    use std::io::Write;
    use std::path::{Path, PathBuf};
    use std::time::{SystemTime, UNIX_EPOCH};
    use zip::write::FileOptions;
    use zip::{CompressionMethod, ZipWriter};

    fn temporary_directory(name: &str) -> std::path::PathBuf {
        let unique_suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be after UNIX epoch")
            .as_nanos();
        std::env::temp_dir().join(format!(
            "airpg-{name}-{}-{unique_suffix}",
            std::process::id()
        ))
    }

    fn test_repository(campaigns_dir: PathBuf) -> CampaignRepository {
        CampaignRepository {
            secret_campaigns_dir: campaigns_dir.join("secret"),
            campaigns_dir,
        }
    }

    fn write_archive(path: &Path, json_name: &str, contents: &str, entries: &[(&str, &[u8])]) {
        let file = File::create(path).expect("campaign archive should be created");
        let mut archive = ZipWriter::new(file);
        let options: FileOptions<'_, ()> =
            FileOptions::default().compression_method(CompressionMethod::Stored);
        archive
            .start_file(json_name, options)
            .expect("campaign JSON should be added");
        archive
            .write_all(contents.as_bytes())
            .expect("campaign JSON should be written");
        for (name, bytes) in entries {
            archive
                .start_file(*name, options)
                .expect("archive entry should be added");
            archive
                .write_all(bytes)
                .expect("archive entry should be written");
        }
        archive
            .finish()
            .expect("campaign archive should be finished");
    }

    #[test]
    fn reads_airpg_campaign_and_lists_prefixed_images() {
        let campaigns_dir = temporary_directory("campaigns");
        fs::create_dir_all(&campaigns_dir)
            .expect("temporary campaigns directory should be created");
        write_archive(
            &campaigns_dir.join("naufrago.airpg"),
            "Mafia_campaign.json",
            r#"{"campaign":{"title":"Naufrago","tags":["ÉPICO","ALTA FANTASIA"]}}"#,
            &[
                ("images/poster_2.png", &[1, 2]),
                ("images/banner.png", &[3, 4]),
                ("images/poster_10.png", &[11, 12]),
                ("images/poster_1.jpg", &[5, 6]),
                ("images/other.png", &[7, 8]),
                ("not-images/poster.png", &[9, 10]),
            ],
        );
        let secret_dir = campaigns_dir.join("secret");
        fs::create_dir_all(&secret_dir).expect("secret campaigns directory should be created");
        write_archive(
            &secret_dir.join("segredo.airpg"),
            "segredo_campaign.json",
            r#"{"campaign":{"title":"Segredo","tags":[]}}"#,
            &[],
        );
        fs::write(campaigns_dir.join("notes.txt"), "not a campaign").unwrap();

        let campaigns = test_repository(campaigns_dir.clone()).get_campaigns();

        let campaigns = campaigns.expect("campaign JSON should be loaded");
        assert_eq!(campaigns.len(), 1);
        assert_eq!(campaigns[0].id, "naufrago");
        assert_eq!(campaigns[0].title, "Naufrago");
        assert_eq!(campaigns[0].tags, ["ÉPICO", "ALTA FANTASIA"]);
        assert!(campaigns[0].missing_fields.is_empty());
        assert_eq!(
            campaigns[0]
                .poster_images
                .iter()
                .map(|image| image.rsplit("::").next().unwrap())
                .collect::<Vec<_>>(),
            [
                "images/poster_1.jpg",
                "images/poster_2.png",
                "images/poster_10.png"
            ]
        );
        assert_eq!(
            campaigns[0]
                .banner_images
                .iter()
                .map(|image| image.rsplit("::").next().unwrap())
                .collect::<Vec<_>>(),
            ["images/banner.png"]
        );
        assert_eq!(
            campaigns.len(),
            1,
            "regular listing should exclude secret campaigns"
        );

        let secret_campaigns = test_repository(campaigns_dir.clone())
            .get_secret_campaigns()
            .expect("secret campaign listing should load");
        assert_eq!(secret_campaigns.len(), 1);
        assert_eq!(secret_campaigns[0].id, "segredo");
        assert_eq!(secret_campaigns[0].title, "Segredo");
        fs::remove_dir_all(&campaigns_dir)
            .expect("temporary campaigns directory should be removed");
    }

    #[test]
    fn missing_optional_fields_do_not_prevent_loading_campaign() {
        let campaigns_dir = temporary_directory("campaign-missing-fields");
        fs::create_dir_all(&campaigns_dir)
            .expect("temporary campaigns directory should be created");
        write_archive(
            &campaigns_dir.join("incomplete.airpg"),
            "incomplete_campaign.json",
            r#"{"campaign":{"title":"Incomplete"}}"#,
            &[],
        );

        let campaigns = test_repository(campaigns_dir.clone()).get_campaigns();
        fs::remove_dir_all(&campaigns_dir)
            .expect("temporary campaigns directory should be removed");

        let campaigns = campaigns.expect("campaign with missing optional fields should load");
        assert_eq!(campaigns.len(), 1);
        assert_eq!(campaigns[0].title, "Incomplete");
        assert!(campaigns[0].tags.is_empty());
        assert!(campaigns[0].poster_images.is_empty());
        assert!(campaigns[0].banner_images.is_empty());
        assert_eq!(campaigns[0].missing_fields, ["tags"]);
    }

    #[test]
    fn skips_campaigns_with_multiple_root_json_files() {
        let campaigns_dir = temporary_directory("campaign-multiple-json");
        fs::create_dir_all(&campaigns_dir)
            .expect("temporary campaigns directory should be created");
        write_archive(
            &campaigns_dir.join("valid.airpg"),
            "valid_campaign.json",
            r#"{"campaign":{"title":"Valid","tags":[]}}"#,
            &[],
        );
        write_archive(
            &campaigns_dir.join("ambiguous.airpg"),
            "Mafia_campaign.json",
            r#"{"campaign":{"title":"Ambiguous","tags":[]}}"#,
            &[("another.json", br#"{"campaign":{"title":"Other"}}"#)],
        );

        let campaigns = test_repository(campaigns_dir.clone())
            .get_campaigns()
            .expect("campaign listing should continue when an archive is ambiguous");
        fs::remove_dir_all(&campaigns_dir).expect("temporary directory should be removed");

        assert_eq!(campaigns.len(), 1);
        assert_eq!(campaigns[0].id, "valid");
    }

    #[test]
    fn validates_campaigns_from_regular_and_secret_roots() {
        let root = temporary_directory("campaign-validation");
        let campaigns_dir = root.join("regular");
        let secret_campaigns_dir = root.join("encrypted");
        let outside_dir = root.join("outside");
        fs::create_dir_all(&campaigns_dir).expect("regular directory should be created");
        fs::create_dir_all(&secret_campaigns_dir).expect("secret directory should be created");
        fs::create_dir_all(&outside_dir).expect("outside directory should be created");
        let regular_campaign = campaigns_dir.join("regular.airpg");
        let secret_campaign = secret_campaigns_dir.join("secret.airpg");
        let outside_campaign = outside_dir.join("outside.airpg");
        let json = r#"{"campaign":{"title":"Test","tags":[]}}"#;
        write_archive(&regular_campaign, "campaign.json", json, &[]);
        write_archive(&secret_campaign, "campaign.json", json, &[]);
        write_archive(&outside_campaign, "campaign.json", json, &[]);
        let repository = CampaignRepository {
            campaigns_dir: campaigns_dir.clone(),
            secret_campaigns_dir: secret_campaigns_dir.clone(),
        };

        let regular_result = repository.validate_campaign_path(
            regular_campaign
                .to_str()
                .expect("regular campaign path should be valid UTF-8"),
        );
        let secret_result = repository.validate_campaign_path(
            secret_campaign
                .to_str()
                .expect("secret campaign path should be valid UTF-8"),
        );
        let outside_result = repository.validate_campaign_path(
            outside_campaign
                .to_str()
                .expect("outside campaign path should be valid UTF-8"),
        );
        fs::remove_dir_all(&root).expect("temporary directory should be removed");

        assert!(regular_result.is_ok());
        assert!(secret_result.is_ok());
        assert!(outside_result.is_err());
    }

    #[test]
    fn reads_image_from_archive_and_rejects_images_outside_campaign_directory() {
        let root = temporary_directory("campaign-images");
        let campaigns_dir = root.join("campaigns");
        fs::create_dir_all(&root).expect("temporary root should be created");
        fs::create_dir_all(&campaigns_dir)
            .expect("temporary campaigns directory should be created");
        let archive_path = campaigns_dir.join("campaign.airpg");
        write_archive(
            &archive_path,
            "campaign_data.json",
            r#"{"campaign":{"title":"Test","tags":[]}}"#,
            &[("images/poster.png", &[1, 2, 3])],
        );
        let outside_image = root.join("outside.png");
        fs::write(&outside_image, [4, 5, 6]).expect("outside image should be written");

        let repository = test_repository(campaigns_dir.clone());
        let poster_path = "campaigns::campaign.airpg::images/poster.png";
        let image = repository
            .read_campaign_image(poster_path)
            .expect("image inside campaigns directory should be readable");
        let rejected = repository.read_campaign_image(
            outside_image
                .to_str()
                .expect("temporary image path should be valid UTF-8"),
        );
        fs::remove_dir_all(&root).expect("temporary directory should be removed");

        assert_eq!(image.bytes, [1, 2, 3]);
        assert_eq!(image.content_type, "image/png");
        assert!(poster_path.starts_with("campaigns::"));
        assert!(rejected.is_err());
    }

    #[test]
    fn resolves_nested_campaign_images_relative_to_campaigns_root() {
        let campaigns_dir = temporary_directory("nested-campaign-images");
        let secret_dir = campaigns_dir.join("secret");
        fs::create_dir_all(&secret_dir).expect("secret campaign directory should be created");
        write_archive(
            &secret_dir.join("campaign.airpg"),
            "campaign.json",
            r#"{"campaign":{"title":"Secret","tags":[]}}"#,
            &[("images/poster.png", &[7, 8, 9])],
        );
        let repository = test_repository(campaigns_dir.clone());

        let campaign = repository
            .get_secret_campaigns()
            .expect("secret campaign should be listed")
            .pop()
            .expect("secret campaign should exist");
        assert!(campaign.poster_images[0].starts_with("secret::"));

        let image = repository
            .read_campaign_image(&campaign.poster_images[0])
            .expect("nested campaign image should be readable");
        fs::remove_dir_all(&campaigns_dir).expect("temporary directory should be removed");

        assert_eq!(image.bytes, [7, 8, 9]);
    }

    #[test]
    fn extracts_campaign_json_from_archive_for_startup() {
        let campaigns_dir = temporary_directory("campaign-json-extraction");
        fs::create_dir_all(&campaigns_dir)
            .expect("temporary campaigns directory should be created");
        let archive_path = campaigns_dir.join("campaign.airpg");
        let json = br#"{"campaign":{"title":"Test"}}"#;
        write_archive(
            &archive_path,
            "Mafia_campaign.json",
            std::str::from_utf8(json).unwrap(),
            &[],
        );
        let repository = test_repository(campaigns_dir.clone());

        let extracted = repository
            .read_campaign_json(&archive_path)
            .expect("campaign JSON should be extracted");
        fs::remove_dir_all(&campaigns_dir).expect("temporary directory should be removed");

        assert_eq!(extracted, json);
    }
}
