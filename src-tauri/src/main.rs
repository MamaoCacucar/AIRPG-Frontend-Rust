#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use campaign_repository::{Campaign, CampaignImage, CampaignRepository};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs::{self, File, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager, State};

mod campaign_repository;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActiveCampaign {
    pub id: String,
    pub tag: String,
    pub title: String,
    pub description: String,
    pub image_url: String,
}

#[tauri::command]
fn get_active_campaigns() -> Vec<ActiveCampaign> {
    vec![
        ActiveCampaign {
            id: "1".into(),
            tag: "ÚLTIMA SESSÃO".into(),
            title: "Neon Drift: Neo-Tokyo".into(),
            description: "“Andando pelo beco onde apenas leds brilham...” • 4° Rodada".into(),
            image_url: "/assets/templates/campaign.png".into(),
        },
        ActiveCampaign {
            id: "2".into(),
            tag: "CAMPANHA MAIS LONGA".into(),
            title: "Cyber-Sampa 2077".into(),
            description: "“Você finalmente alcança o beco...” • 50° Rodada".into(),
            image_url: "/assets/templates/campaign.png".into(),
        },
        ActiveCampaign {
            id: "3".into(),
            tag: "LOBISOMEM SEGUE DESAPARECIDO".into(),
            title: "Bosque de Prata".into(),
            description: "“O vilarejo teme o pior...” • 10° Rodada".into(),
            image_url: "/assets/templates/campaign.png".into(),
        },
    ]
}

#[tauri::command]
fn get_campaigns() -> Result<Vec<Campaign>, String> {
    CampaignRepository::from_env()?.get_campaigns()
}

#[tauri::command]
fn get_secret_campaigns(admin_code: String) -> Result<Vec<Campaign>, String> {
    if admin_code != "admin" {
        return Err("Modo admin não autorizado".into());
    }

    CampaignRepository::from_env()?.get_secret_campaigns()
}

#[tauri::command]
fn get_campaign_image(path: String) -> Result<CampaignImage, String> {
    CampaignRepository::from_env()?.read_campaign_image(&path)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(
    tag = "type",
    rename_all = "lowercase",
    rename_all_fields = "camelCase"
)]
pub enum HistoryItem {
    Image {
        id: u32,
        image_url: String,
    },
    Narrative {
        id: u32,
        text: String,
        metadata: String,
    },
    User {
        id: u32,
        text: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameSession {
    pub campaign_title: String,
    pub campaign_tags: Vec<String>,
    pub round_number: u32,
    pub history: Vec<HistoryItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SidecarEvent {
    #[serde(rename = "type")]
    event_type: String,
    payload: Value,
}

struct RunningSidecar {
    child: Child,
    stdin: ChildStdin,
    stderr_reader: Option<std::thread::JoinHandle<()>>,
}

impl Drop for RunningSidecar {
    fn drop(&mut self) {
        let _ = writeln!(self.stdin, r#"{{"payload":"/sair"}}"#);
        let _ = self.stdin.flush();
        let _ = self.child.kill();
        let _ = self.child.wait();
        if let Some(stderr_reader) = self.stderr_reader.take() {
            let _ = stderr_reader.join();
        }
    }
}

#[derive(Default)]
struct SidecarState {
    process: Option<RunningSidecar>,
    session: Option<(String, GameSession)>,
}

#[derive(Default)]
struct SidecarManager {
    state: Mutex<SidecarState>,
}

impl Drop for SidecarManager {
    fn drop(&mut self) {
        if let Ok(state) = self.state.get_mut() {
            drop(state.process.take());
        }
    }
}

fn backend_directory() -> Result<PathBuf, String> {
    if let Some(directory) = std::env::var_os("AIRPG_BACKEND_DIR") {
        let directory = PathBuf::from(directory);
        if directory.join("main.py").is_file() {
            return directory
                .canonicalize()
                .map_err(|error| format!("Não foi possível acessar o backend Python: {error}"));
        }
        return Err(format!(
            "AIRPG_BACKEND_DIR não contém main.py: '{}'",
            directory.display()
        ));
    }

    let current_dir = std::env::current_dir()
        .map_err(|error| format!("Não foi possível obter a pasta atual: {error}"))?;
    let candidates = [
        current_dir.clone(),
        current_dir
            .parent()
            .map(|parent| parent.join("AIRPG-Backend-Py"))
            .unwrap_or_default(),
    ];
    candidates
        .into_iter()
        .find(|directory| directory.join("main.py").is_file())
        .ok_or_else(|| {
            "Backend Python não encontrado. Defina AIRPG_BACKEND_DIR no ambiente.".into()
        })
}

fn python_executable(backend_dir: &Path) -> PathBuf {
    if let Some(executable) = std::env::var_os("AIRPG_PYTHON") {
        return PathBuf::from(executable);
    }

    #[cfg(windows)]
    let venv_python = backend_dir.join("venv").join("Scripts").join("python.exe");
    #[cfg(not(windows))]
    let venv_python = backend_dir.join("venv").join("bin").join("python");

    if venv_python.is_file() {
        venv_python
    } else {
        PathBuf::from("python")
    }
}

fn parse_event(line: &str) -> Result<SidecarEvent, String> {
    serde_json::from_str(line)
        .map_err(|error| format!("Resposta IPC inválida do backend Python: {error}"))
}

fn prepare_frontend_event(mut event: SidecarEvent) -> Result<SidecarEvent, String> {
    if event.event_type != "image" {
        return Ok(event);
    }

    let image_path = event
        .payload
        .get("imagePath")
        .and_then(Value::as_str)
        .ok_or_else(|| "O evento de imagem não contém imagePath".to_string())?;
    let image_path = Path::new(image_path)
        .canonicalize()
        .map_err(|error| format!("Não foi possível abrir a imagem '{image_path}': {error}"))?;
    if !image_path.is_file() {
        return Err(format!(
            "O caminho da imagem não é um arquivo: '{}'",
            image_path.display()
        ));
    }

    let content_type = image_content_type(&image_path)?;
    let max_size = 32 * 1024 * 1024;
    let metadata = fs::metadata(&image_path)
        .map_err(|error| format!("Não foi possível consultar a imagem: {error}"))?;
    if metadata.len() > max_size {
        return Err(format!(
            "A imagem excede o limite de 32 MiB: '{}'",
            image_path.display()
        ));
    }
    let bytes =
        fs::read(&image_path).map_err(|error| format!("Não foi possível ler a imagem: {error}"))?;
    event.payload = serde_json::json!({
        "bytes": bytes,
        "contentType": content_type,
    });
    Ok(event)
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
        None => Err("A imagem gerada não possui extensão".into()),
    }
}

fn open_sidecar_log(backend_dir: &Path) -> Result<(PathBuf, Arc<Mutex<File>>), String> {
    let log_directory = backend_dir.join("temp");
    let log_path = log_directory.join("sidecar.log");
    let file = OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(&log_path)
        .map_err(|error| {
            format!(
                "Não foi possível abrir o log do backend '{}': {error}",
                log_path.display()
            )
        })?;
    Ok((log_path, Arc::new(Mutex::new(file))))
}

fn write_sidecar_log(log: &Arc<Mutex<File>>, stream: &str, line: &str) -> Result<(), String> {
    let mut file = log
        .lock()
        .map_err(|_| "O arquivo de log do backend ficou indisponível".to_string())?;
    writeln!(file, "[{stream}] {line}")
        .and_then(|()| file.flush())
        .map_err(|error| format!("Não foi possível gravar o log do backend: {error}"))
}

fn read_lossy_lines<R, F>(mut reader: R, mut on_line: F) -> std::io::Result<()>
where
    R: BufRead,
    F: FnMut(String),
{
    let mut bytes = Vec::new();
    loop {
        bytes.clear();
        if reader.read_until(b'\n', &mut bytes)? == 0 {
            return Ok(());
        }
        if bytes.last() == Some(&b'\n') {
            bytes.pop();
        }
        if bytes.last() == Some(&b'\r') {
            bytes.pop();
        }
        on_line(String::from_utf8_lossy(&bytes).into_owned());
    }
}

fn stop_sidecar(manager: &SidecarManager) -> Result<(), String> {
    let mut state = manager
        .state
        .lock()
        .map_err(|_| "Estado do sidecar Python indisponível".to_string())?;
    state.session = None;
    drop(state.process.take());
    Ok(())
}

fn sidecar_exit_status(manager: &SidecarManager) -> String {
    let Ok(mut state) = manager.state.lock() else {
        return "indisponível".into();
    };
    let Some(process) = state.process.as_mut() else {
        return "indisponível".into();
    };

    match process.child.try_wait() {
        Ok(Some(status)) => status.to_string(),
        Ok(None) => "processo ainda ativo".into(),
        Err(error) => format!("erro ao consultar processo: {error}"),
    }
}

fn startup_error(manager: &SidecarManager, error: String) -> String {
    match stop_sidecar(manager) {
        Ok(()) => error,
        Err(stop_error) => {
            format!("{error}; também houve erro ao encerrar o backend: {stop_error}")
        }
    }
}

fn campaign_key(campaign_path: &Path) -> Result<String, String> {
    campaign_path
        .file_stem()
        .and_then(|stem| stem.to_str())
        .map(str::to_string)
        .ok_or_else(|| "Não foi possível obter o ID do arquivo da campanha".into())
}

#[tauri::command]
fn start_campaign(
    app: AppHandle,
    manager: State<'_, SidecarManager>,
    campaign_path: String,
    campaign_tags: Vec<String>,
) -> Result<GameSession, String> {
    let mut state = manager
        .state
        .lock()
        .map_err(|_| "Estado do sidecar Python indisponível".to_string())?;
    if state.process.is_some() {
        return Err("Já existe uma sessão de campanha em execução".into());
    }

    let repository = CampaignRepository::from_env()?;
    let campaign_path = repository.validate_campaign_path(&campaign_path)?;
    let campaign_id = campaign_key(&campaign_path)?;
    let backend_dir = backend_directory()?;
    let python = python_executable(&backend_dir);
    let (log_path, log_file) = open_sidecar_log(&backend_dir)?;
    write_sidecar_log(
        &log_file,
        "RUST",
        &format!(
            "Iniciando sidecar: {:?} {:?} -prod --campaign {:?}",
            python,
            backend_dir.join("main.py"),
            campaign_path
        ),
    )?;
    let mut child = Command::new(python)
        .arg(&backend_dir.join("main.py"))
        .arg("-prod")
        .arg("--campaign")
        .arg(&campaign_path)
        .current_dir(&backend_dir)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| {
            let message = format!("Não foi possível iniciar o backend Python: {error}");
            let _ = write_sidecar_log(&log_file, "RUST", &message);
            format!("{message}. Log: '{}'", log_path.display())
        })?;

    let stdin = match child.stdin.take() {
        Some(stdin) => stdin,
        None => {
            let _ = child.kill();
            let _ = child.wait();
            return Err("Não foi possível abrir a entrada IPC do backend Python".into());
        }
    };
    let stdout = match child.stdout.take() {
        Some(stdout) => stdout,
        None => {
            let _ = child.kill();
            let _ = child.wait();
            return Err("Não foi possível abrir a saída IPC do backend Python".into());
        }
    };
    let stderr = match child.stderr.take() {
        Some(stderr) => stderr,
        None => {
            let _ = child.kill();
            let _ = child.wait();
            return Err("Não foi possível capturar os erros do backend Python".into());
        }
    };
    let stderr_log = Arc::clone(&log_file);
    let stderr_reader = std::thread::spawn(move || {
        if let Err(error) = read_lossy_lines(BufReader::new(stderr), |line| {
            if let Err(error) = write_sidecar_log(&stderr_log, "STDERR", &line) {
                eprintln!("{error}");
            }
        }) {
            let _ = write_sidecar_log(
                &stderr_log,
                "RUST",
                &format!("Erro ao ler stderr do backend: {error}"),
            );
        }
    });
    state.process = Some(RunningSidecar {
        child,
        stdin,
        stderr_reader: Some(stderr_reader),
    });
    drop(state);

    let mut reader = BufReader::new(stdout);
    let mut campaign_title = None;
    let mut first_narrative = None;
    let mut line = String::new();

    while campaign_title.is_none() || first_narrative.is_none() {
        line.clear();
        let bytes_read = reader.read_line(&mut line).map_err(|error| {
            let _ = write_sidecar_log(
                &log_file,
                "RUST",
                &format!("Erro ao ler stdout do backend: {error}"),
            );
            startup_error(
                manager.inner(),
                format!(
                    "Erro ao ler IPC do backend Python: {error}. Log: '{}'",
                    log_path.display()
                ),
            )
        })?;
        if bytes_read == 0 {
            let exit_status = sidecar_exit_status(manager.inner());
            let _ = write_sidecar_log(
                &log_file,
                "RUST",
                &format!(
                    "O stdout do backend foi encerrado antes da campanha e da narrativa inicial. Status: {exit_status}"
                ),
            );
            return Err(startup_error(
                manager.inner(),
                format!(
                    "O backend Python encerrou antes de enviar a campanha e a narrativa inicial (status: {exit_status}). Log: '{}'",
                    log_path.display()
                ),
            ));
        }
        write_sidecar_log(&log_file, "STDOUT", line.trim_end()).map_err(|error| {
            startup_error(
                manager.inner(),
                format!("{error}. Log: '{}'", log_path.display()),
            )
        })?;

        let event = match parse_event(line.trim_end()) {
            Ok(event) => event,
            Err(error) => {
                let _ = write_sidecar_log(&log_file, "RUST", &error);
                return Err(startup_error(
                    manager.inner(),
                    format!("{error}. Log: '{}'", log_path.display()),
                ));
            }
        };
        match event.event_type.as_str() {
            "campaign" => {
                campaign_title = event
                    .payload
                    .get("title")
                    .and_then(Value::as_str)
                    .map(str::to_string);
                if campaign_title.is_none() {
                    return Err(startup_error(
                        manager.inner(),
                        format!(
                            "O backend enviou os dados da campanha sem um título. Log: '{}'",
                            log_path.display()
                        ),
                    ));
                }
            }
            "narrative" => {
                first_narrative = event
                    .payload
                    .get("text")
                    .and_then(Value::as_str)
                    .map(str::to_string);
                if !matches!(first_narrative.as_deref(), Some(text) if !text.is_empty()) {
                    return Err(startup_error(
                        manager.inner(),
                        format!(
                            "O backend enviou uma narrativa inicial vazia. Log: '{}'",
                            log_path.display()
                        ),
                    ));
                }
            }
            "system_message" => {
                if let Some(message) = event.payload.get("text").and_then(Value::as_str) {
                    if message.starts_with("ERRO") {
                        return Err(startup_error(
                            manager.inner(),
                            format!("{message}. Log: '{}'", log_path.display()),
                        ));
                    }
                }
            }
            _ => {}
        }
    }

    let campaign_title = campaign_title.ok_or_else(|| {
        startup_error(
            manager.inner(),
            "O backend não enviou os dados da campanha".into(),
        )
    })?;
    let first_narrative = first_narrative.ok_or_else(|| {
        startup_error(
            manager.inner(),
            "O backend não enviou a narrativa inicial".into(),
        )
    })?;
    let session = GameSession {
        campaign_title,
        campaign_tags,
        round_number: 1,
        history: vec![HistoryItem::Narrative {
            id: 1,
            text: first_narrative,
            metadata: "Narrativa inicial".into(),
        }],
    };
    let mut state = manager
        .state
        .lock()
        .map_err(|_| "Estado do sidecar Python indisponível".to_string())?;
    if state.process.is_none() {
        return Err("O backend Python foi encerrado antes de concluir a inicialização".into());
    }
    state.session = Some((campaign_id, session.clone()));
    drop(state);

    let app_handle = app.clone();
    let stdout_log = Arc::clone(&log_file);
    std::thread::spawn(move || {
        for line in reader.lines() {
            match line {
                Ok(line) => match parse_event(&line) {
                    Ok(event) => {
                        if let Err(error) = write_sidecar_log(&stdout_log, "STDOUT", &line) {
                            eprintln!("{error}");
                            break;
                        }
                        let event = match prepare_frontend_event(event) {
                            Ok(event) => event,
                            Err(error) => {
                                let log_error = write_sidecar_log(&stdout_log, "RUST", &error);
                                if let Err(log_error) = log_error {
                                    eprintln!("{log_error}");
                                }
                                if let Err(emit_error) = app_handle.emit(
                                    "sidecar-event",
                                    SidecarEvent {
                                        event_type: "system_message".into(),
                                        payload: serde_json::json!({"text": error}),
                                    },
                                ) {
                                    eprintln!("Erro ao encaminhar erro da imagem: {emit_error}");
                                }
                                continue;
                            }
                        };
                        if let Err(error) = app_handle.emit("sidecar-event", event) {
                            eprintln!("Erro ao encaminhar evento do sidecar: {error}");
                        }
                    }
                    Err(error) => {
                        let _ = write_sidecar_log(&stdout_log, "RUST", &error);
                        break;
                    }
                },
                Err(error) => {
                    let _ = write_sidecar_log(
                        &stdout_log,
                        "RUST",
                        &format!("Erro ao ler saída do sidecar Python: {error}"),
                    );
                    break;
                }
            }
        }
    });

    Ok(session)
}

#[tauri::command]
fn load_game_session(state: State<'_, SidecarManager>, id: String) -> Result<GameSession, String> {
    let state = state
        .state
        .lock()
        .map_err(|_| "Estado da sessão indisponível".to_string())?;
    match &state.session {
        Some((campaign_id, session)) if campaign_id == &id => Ok(session.clone()),
        _ => Err("A campanha ainda não foi iniciada nesta sessão".into()),
    }
}

#[tauri::command]
fn send_player_input(state: State<'_, SidecarManager>, input: String) -> Result<(), String> {
    if input.trim().is_empty() {
        return Err("A ação do jogador não pode estar vazia".into());
    }

    let mut state = state
        .state
        .lock()
        .map_err(|_| "Estado do sidecar Python indisponível".to_string())?;
    let process = state
        .process
        .as_mut()
        .ok_or_else(|| "Não existe uma sessão de jogo ativa".to_string())?;
    if let Some(status) = process
        .child
        .try_wait()
        .map_err(|error| format!("Não foi possível consultar o backend Python: {error}"))?
    {
        return Err(format!("O backend Python já foi encerrado ({status})"));
    }

    let message = serde_json::json!({ "payload": input.trim() });
    serde_json::to_writer(&mut process.stdin, &message)
        .and_then(|()| {
            process
                .stdin
                .write_all(b"\n")
                .map_err(serde_json::Error::io)
        })
        .map_err(|error| format!("Não foi possível enviar a ação ao backend: {error}"))?;
    process
        .stdin
        .flush()
        .map_err(|error| format!("Não foi possível enviar a ação ao backend: {error}"))
}

#[tauri::command]
fn stop_game_session(state: State<'_, SidecarManager>) -> Result<(), String> {
    let mut state = state
        .state
        .lock()
        .map_err(|_| "Estado do sidecar Python indisponível".to_string())?;
    if let Some(mut process) = state.process.take() {
        let send_error = writeln!(process.stdin, r#"{{"payload":"/sair"}}"#)
            .and_then(|()| process.stdin.flush())
            .err()
            .map(|error| format!("Não foi possível enviar encerramento ao Python: {error}"));
        let kill_error = process
            .child
            .kill()
            .err()
            .filter(|error| error.kind() != std::io::ErrorKind::InvalidInput)
            .map(|error| format!("Não foi possível encerrar o processo Python: {error}"));
        let wait_error =
            process.child.wait().err().map(|error| {
                format!("Não foi possível aguardar o encerramento do Python: {error}")
            });
        state.session = None;
        drop(process);
        if let Some(error) = send_error.or(kill_error).or(wait_error) {
            return Err(error);
        }
    }
    state.session = None;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .manage(SidecarManager::default())
        .invoke_handler(tauri::generate_handler![
            get_active_campaigns,
            get_campaigns,
            get_secret_campaigns,
            get_campaign_image,
            start_campaign,
            load_game_session,
            send_player_input,
            stop_game_session
        ])
        .plugin(tauri_plugin_shell::init())
        .on_window_event(|window, event| {
            if matches!(event, tauri::WindowEvent::CloseRequested { .. }) {
                if let Err(error) = stop_sidecar(&window.state::<SidecarManager>()) {
                    eprintln!("Erro ao encerrar o sidecar ao fechar a janela: {error}");
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar a interface do Tauri");
}

#[cfg(test)]
mod tests {
    use super::{
        image_content_type, open_sidecar_log, prepare_frontend_event, read_lossy_lines,
        write_sidecar_log, SidecarEvent,
    };
    use serde_json::json;
    use std::fs;
    use std::io::Cursor;
    use std::path::Path;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn sidecar_output_is_saved_to_a_truncated_log_file() {
        let unique_suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be after UNIX epoch")
            .as_nanos();
        let backend_dir = std::env::temp_dir().join(format!(
            "airpg-sidecar-log-{}-{unique_suffix}",
            std::process::id()
        ));
        fs::create_dir_all(&backend_dir).expect("temporary backend directory should be created");

        let (log_path, log) = open_sidecar_log(&backend_dir).expect("sidecar log should open");
        write_sidecar_log(&log, "STDERR", "Python traceback").expect("log entry should be written");
        drop(log);

        assert_eq!(
            fs::read_to_string(&log_path).expect("log should be readable"),
            "[STDERR] Python traceback\n"
        );
        fs::remove_dir_all(backend_dir).expect("temporary backend directory should be removed");
    }

    #[test]
    fn generated_image_event_contains_image_bytes_and_mime_type() {
        let unique_suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be after UNIX epoch")
            .as_nanos();
        let image_path = std::env::temp_dir().join(format!(
            "airpg-image-{}-{unique_suffix}.png",
            std::process::id()
        ));
        fs::write(&image_path, [137, 80, 78, 71]).expect("temporary image should be created");

        let event = prepare_frontend_event(SidecarEvent {
            event_type: "image".into(),
            payload: json!({"imagePath": image_path.display().to_string()}),
        })
        .expect("image event should be prepared");

        assert_eq!(event.payload["contentType"], "image/png");
        assert_eq!(event.payload["bytes"], json!([137, 80, 78, 71]));
        fs::remove_file(image_path).expect("temporary image should be removed");
    }

    #[test]
    fn rejects_unsupported_generated_image_format() {
        assert!(image_content_type(Path::new("generated.svg")).is_err());
    }

    #[test]
    fn stderr_reader_preserves_lines_with_non_utf8_bytes() {
        let mut lines = Vec::new();
        read_lossy_lines(Cursor::new(b"progress \xff\ntraceback\n"), |line| {
            lines.push(line)
        })
        .expect("stderr reader should accept arbitrary bytes");

        assert_eq!(lines, ["progress �", "traceback"]);
    }
}
