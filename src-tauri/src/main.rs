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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Campaign {
    pub id: String,
    pub title: String,
    pub poster_url: String,
    pub tags: Vec<String>,
}

#[tauri::command]
fn get_campaigns() -> Vec<Campaign> {
    vec![
        Campaign {
            id: "1".into(),
            title: "O Despertar dos Deuses".into(),
            tags: vec!["ÉPICO".into(), "ALTA FANTASIA".into()],
            poster_url: "/assets/templates/posterCampaign.png".into(),
        },
        Campaign {
            id: "2".into(),
            title: "Sombras de Londres".into(),
            tags: vec!["MISTÉRIO".into(), "GÓTICO".into()],
            poster_url: "/assets/templates/posterCampaign.png".into(),
        },
    ]
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(
    tag = "type",
    rename_all = "lowercase",
    rename_all_fields = "camelCase"
)]
pub enum HistoryItem {
    Image { id: u32, image_url: String },
    Narrative {
        id: u32,
        text: String,
        metadata: String,
    },
    User { id: u32, text: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameSession {
    pub campaign_title: String,
    pub round_number: u32,
    pub history: Vec<HistoryItem>,
}

#[tauri::command]
fn load_game_session(id: String) -> GameSession {
    let _campaign_id = id;

    GameSession {
        campaign_title: "Neon Drift: Neo-Tokyo".into(),
        round_number: 4,
        history: vec![
            HistoryItem::Image {
                id: 1,
                image_url: "/assets/templates/campaign.png".into()
            },
            HistoryItem::Narrative {
                id: 2,
                text: "O ar na cobertura do Setor 7 é pesado, saturado com o cheiro metálico de ozônio e chuva ácida. Abaixo de você, a cidade de Obsidiana pulsa como um coração mecânico doente. As luzes de neon cortam a névoa, mas não conseguem iluminar as sombras que se movem entre os dutos de ventilação. \"Você não deveria ter vindo aqui, Cronista. Algumas histórias foram feitas para permanecerem enterradas sob o concreto e o silêncio.\" Uma figura encapuzada emerge da fumaça, a luz de um holograma publicitário refletindo em uma máscara cibernética reluzente. O som de uma lâmina sendo desembainhada ecoa contra o metal do piso.".into(),
                metadata: "Rodada gerada em 2 minutos e 36 segundos".into(),
            },
            HistoryItem::User {
                id: 3,
                text: "Eu me aproximo da borda, mantendo a mão no cabo da minha pistola térmica. \"Eu não vim por histórias, vim pela verdade que você está tentando esconder no núcleo de dados.\"".into(),
            },
            HistoryItem::Image {
                id: 4,
                image_url: "/assets/templates/campaign.png".into()
            },
            HistoryItem::Narrative {
                id: 5,
                text: "O ar na cobertura do Setor 7 é pesado, saturado com o cheiro metálico de ozônio e chuva ácida. Abaixo de você, a cidade de Obsidiana pulsa como um coração mecânico doente. As luzes de neon cortam a névoa, mas não conseguem iluminar as sombras que se movem entre os dutos de ventilação. \"Você não deveria ter vindo aqui, Cronista. Algumas histórias foram feitas para permanecerem enterradas sob o concreto e o silêncio.\" Uma figura encapuzada emerge da fumaça, a luz de um holograma publicitário refletindo em uma máscara cibernética reluzente. O som de uma lâmina sendo desembainhada ecoa contra o metal do piso.".into(),
                metadata: "Rodada gerada em 2 minutos".into(),
            },
            HistoryItem::User {
                id: 6,
                text: "Saco a minha arma rapidamente e aponto na direção da figura cibernética.".into(),
            },
        ],
    }
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
            load_game_session,
            start_engine])
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar a interface do Tauri");
}