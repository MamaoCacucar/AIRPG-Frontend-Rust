#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::{Deserialize, Serialize};

// Comando para ler a pasta de campanhas (mockado para o teste de UI)
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
    // No futuro, isso usará o fs_manager para ler a pasta /Metadata ou SQLite
    vec![
        ActiveCampaign {
            id: "active-1".into(),
            tag: "Fantasia".into(),
            title: "A Queda de Eldoria FELPINHO".into(),
            description: "Retome sua jornada para salvar o reino de Eldoria.".into(),
            image_url: "/assets/templates/campaign.png".into(),
        },
        ActiveCampaign {
            id: "active-2".into(),
            tag: "Cyberpunk".into(),
            title: "Cyber-Sampa 2077".into(),
            description: "Uma aventura pelas ruas futuristas de São Paulo.".into(),
            image_url: "/assets/templates/campaign.png".into(),
        },
        ActiveCampaign {
            id: "active-3".into(),
            tag: "Mistério".into(),
            title: "Ooo Mistério da Taverna".into(),
            description: "Descubra os segredos escondidos na velha taverna.".into(),
            image_url: "/assets/templates/campaign.png".into(),
        },
    ]
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PosterCampaign {
    pub id: String,
    pub title: String,
    pub banner_url: String,
    pub synopsis: String,
    pub tags: Vec<String>,
}

#[tauri::command]
fn get_campaigns() -> Vec<PosterCampaign> {
    vec![
        PosterCampaign {
            id: "1".into(),
            title: "A Maldição de Strahd".into(),
            banner_url: "/assets/templates/posterCampaign.png".into(),
            synopsis: "Uma jornada sombria pelas terras enevoadas de Barovia.".into(),
            tags: vec!["Gótico".into(), "Terror".into(), "Nível 1-10".into()],
        },
        PosterCampaign {
            id: "2".into(),
            title: "Tumba da Aniquilação".into(),
            banner_url: "/assets/templates/campaign.png".into(),
            synopsis: "Explore selvas perigosas e ruínas ancestrais em Chult.".into(),
            tags: vec!["Exploração".into(), "Selva".into(), "Perigo Real".into()],
        },
    ]
}

// O comando agora recebe a campanha e só é chamado após o clique na UI
#[tauri::command]
fn start_engine(campaign_name: String) -> Result<String, String> {
    println!("Iniciando backend Python para a campanha: {}", campaign_name);
    
    // O código de spawn real do sidecar ficaria aqui. 
    // Por enquanto, retornamos sucesso para testar a transição de tela no React.
    Ok(format!("Engine iniciada para {}", campaign_name))
}

fn main() {
    tauri::Builder::default()
        // Registra os comandos para o React enxergar
        .invoke_handler(tauri::generate_handler![
            get_active_campaigns,
            get_campaigns,
            start_engine])
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar a interface do Tauri");
}