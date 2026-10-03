use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Campaign {
    pub id: String,
    pub title: String,
    pub poster_url: String,
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
    poster_url: Option<String>,
    tags: Option<Vec<String>>,
}

pub struct CampaignRepository {
    campaigns_dir: PathBuf,
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

        Ok(Self { campaigns_dir })
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
        self.read_campaigns_from(&self.campaigns_dir)
    }

    pub fn get_secret_campaigns(&self) -> Result<Vec<Campaign>, String> {
        self.read_campaigns_from(&self.campaigns_dir.join("secret"))
    }

    fn read_campaigns_from(&self, directory: &Path) -> Result<Vec<Campaign>, String> {
        let entries = fs::read_dir(directory).map_err(|error| {
            format!(
                "Não foi possível ler a pasta de campanhas '{}': {error}",
                directory.display()
            )
        })?;
        let mut json_paths = Vec::new();

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
                    .is_some_and(|extension| extension.eq_ignore_ascii_case("json"))
            {
                json_paths.push(path);
            }
        }

        json_paths.sort();
        json_paths
            .into_iter()
            .map(|path| {
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
                let contents = fs::read_to_string(&path).map_err(|error| {
                    format!(
                        "Não foi possível ler o arquivo de campanha '{}': {error}",
                        path.display()
                    )
                })?;
                let file: CampaignFile = serde_json::from_str(&contents).map_err(|error| {
                    format!(
                        "JSON inválido no arquivo de campanha '{}': {error}",
                        path.display()
                    )
                })?;
                let mut missing_fields = Vec::new();
                if file.campaign.tags.is_none() {
                    missing_fields.push("tags".to_string());
                }
                if file.campaign.poster_url.is_none() {
                    missing_fields.push("poster_url".to_string());
                }

                Ok(Campaign {
                    id,
                    title: file.campaign.title,
                    poster_url: file.campaign.poster_url.unwrap_or_default(),
                    tags: file.campaign.tags.unwrap_or_default(),
                    path: path.display().to_string(),
                    missing_fields,
                })
            })
            .collect()
    }

    pub fn validate_campaign_path(&self, campaign_path: &str) -> Result<PathBuf, String> {
        let campaigns_dir = fs::canonicalize(&self.campaigns_dir).map_err(|error| {
            format!(
                "Não foi possível acessar a pasta de campanhas '{}': {error}",
                self.campaigns_dir.display()
            )
        })?;
        let campaign_path = fs::canonicalize(campaign_path)
            .map_err(|error| format!("Não foi possível acessar o arquivo da campanha: {error}"))?;

        let is_json = campaign_path
            .extension()
            .and_then(|extension| extension.to_str())
            .is_some_and(|extension| extension.eq_ignore_ascii_case("json"));
        if !campaign_path.starts_with(&campaigns_dir) || !is_json {
            return Err(
                "O arquivo da campanha precisa ser um JSON dentro da pasta de campanhas".into(),
            );
        }

        if !campaign_path.is_file() {
            return Err("O caminho informado não é um arquivo de campanha".into());
        }

        Ok(campaign_path)
    }

    pub fn read_campaign_image(&self, image_path: &str) -> Result<CampaignImage, String> {
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

        let content_type = match image_path
            .extension()
            .and_then(|extension| extension.to_str())
            .map(str::to_ascii_lowercase)
            .as_deref()
        {
            Some("png") => "image/png",
            Some("jpg" | "jpeg") => "image/jpeg",
            Some("webp") => "image/webp",
            Some("gif") => "image/gif",
            Some("bmp") => "image/bmp",
            Some(extension) => {
                return Err(format!(
                    "Formato de imagem não suportado para '{}': .{extension}",
                    image_path.display()
                ))
            }
            None => {
                return Err(format!(
                    "A imagem da campanha não possui extensão: '{}'",
                    image_path.display()
                ))
            }
        };

        let bytes = fs::read(&image_path).map_err(|error| {
            format!(
                "Não foi possível ler a imagem da campanha '{}': {error}",
                image_path.display()
            )
        })?;

        Ok(CampaignImage {
            bytes,
            content_type: content_type.to_string(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::CampaignRepository;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn reads_campaign_fields_and_uses_file_name_as_id() {
        let unique_suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be after UNIX epoch")
            .as_nanos();
        let campaigns_dir = std::env::temp_dir().join(format!(
            "airpg-campaigns-{}-{unique_suffix}",
            std::process::id()
        ));
        fs::create_dir_all(&campaigns_dir)
            .expect("temporary campaigns directory should be created");
        fs::write(
            campaigns_dir.join("naufrago.json"),
            r#"{
                "campaign": {
                    "title": "Naufrago",
                    "tags": ["ÉPICO", "ALTA FANTASIA"],
                    "poster_url": "/assets/templates/posterCampaign.png",
                    "description": "Campo adicional ignorado pela listagem"
                }
            }"#,
        )
        .expect("campaign JSON should be written");
        let secret_dir = campaigns_dir.join("secret");
        fs::create_dir_all(&secret_dir).expect("secret campaigns directory should be created");
        fs::write(
            secret_dir.join("segredo.json"),
            r#"{"campaign":{"title":"Segredo","tags":[],"poster_url":"poster.png"}}"#,
        )
        .expect("secret campaign JSON should be written");
        fs::write(campaigns_dir.join("notes.txt"), "not a campaign")
            .expect("non-JSON file should be written");

        let campaigns = CampaignRepository {
            campaigns_dir: campaigns_dir.clone(),
        }
        .get_campaigns();

        let campaigns = campaigns.expect("campaign JSON should be loaded");
        assert_eq!(campaigns.len(), 1);
        assert_eq!(campaigns[0].id, "naufrago");
        assert_eq!(campaigns[0].title, "Naufrago");
        assert_eq!(campaigns[0].tags, ["ÉPICO", "ALTA FANTASIA"]);
        assert!(campaigns[0].missing_fields.is_empty());
        assert_eq!(
            campaigns[0].poster_url,
            "/assets/templates/posterCampaign.png"
        );
        assert_eq!(
            campaigns.len(),
            1,
            "regular listing should exclude secret campaigns"
        );

        let secret_campaigns = CampaignRepository {
            campaigns_dir: campaigns_dir.clone(),
        }
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
        let unique_suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be after UNIX epoch")
            .as_nanos();
        let campaigns_dir = std::env::temp_dir().join(format!(
            "airpg-campaign-missing-fields-{}-{unique_suffix}",
            std::process::id()
        ));
        fs::create_dir_all(&campaigns_dir)
            .expect("temporary campaigns directory should be created");
        fs::write(
            campaigns_dir.join("incomplete.json"),
            r#"{"campaign":{"title":"Incomplete"}}"#,
        )
        .expect("incomplete campaign JSON should be written");

        let campaigns = CampaignRepository {
            campaigns_dir: campaigns_dir.clone(),
        }
        .get_campaigns();
        fs::remove_dir_all(&campaigns_dir)
            .expect("temporary campaigns directory should be removed");

        let campaigns = campaigns.expect("campaign with missing optional fields should load");
        assert_eq!(campaigns.len(), 1);
        assert_eq!(campaigns[0].title, "Incomplete");
        assert!(campaigns[0].tags.is_empty());
        assert!(campaigns[0].poster_url.is_empty());
        assert_eq!(campaigns[0].missing_fields, ["tags", "poster_url"]);
    }

    #[test]
    fn reads_image_from_campaign_directory_and_rejects_paths_outside_it() {
        let unique_suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be after UNIX epoch")
            .as_nanos();
        let root = std::env::temp_dir().join(format!(
            "airpg-campaign-images-{}-{unique_suffix}",
            std::process::id()
        ));
        let campaigns_dir = root.join("campaigns");
        let outside_image = root.join("outside.png");
        fs::create_dir_all(&campaigns_dir)
            .expect("temporary campaigns directory should be created");
        fs::write(campaigns_dir.join("poster.png"), [1, 2, 3])
            .expect("temporary campaign image should be written");
        fs::write(&outside_image, [4, 5, 6]).expect("outside image should be written");

        let repository = CampaignRepository {
            campaigns_dir: campaigns_dir.clone(),
        };
        let poster_path = campaigns_dir.join("poster.png");
        let image = repository
            .read_campaign_image(
                poster_path
                    .to_str()
                    .expect("temporary image path should be valid UTF-8"),
            )
            .expect("image inside campaigns directory should be readable");
        let rejected = repository.read_campaign_image(
            outside_image
                .to_str()
                .expect("temporary image path should be valid UTF-8"),
        );
        fs::remove_dir_all(&root).expect("temporary directory should be removed");

        assert_eq!(image.bytes, [1, 2, 3]);
        assert_eq!(image.content_type, "image/png");
        assert!(rejected.is_err());
    }
}
