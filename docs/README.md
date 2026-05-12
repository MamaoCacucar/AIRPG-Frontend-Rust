# DOCUMENTAÇÃO DE ARQUITETURA: FELPINHO's RPG ENGINE

## 1. Escopo
O FELPINHO's RPG Engine é um sistema de RPG de texto de codificação local e modular, projetado para rodar em hardware doméstico. O objetivo é criar uma experiência imersiva de longa duração com memória persistente, coerência visual e acesso híbrido a dados (Local, RAG e Web). O projeto adota uma **Arquitetura Multi-Processo (Parent-Worker)**, garantindo latência zero e uso otimizado de hardware.

## 2. ESPECIFICAÇÕES DE HARDWARE (TARGET)
- **CPU:** AMD Ryzen 7 5700X (8 Cores/16 Threads)
- **GPU:** AMD Radeon RX 7600 8GB VRAM (Interface: DirectML / ZLUDA / Vulkan)
- **RAM:** 32GB DDR4
- **OS:** Windows 11 Nativo

## 3. PADRÃO DE PROJETO E ARQUITETURA
O projeto utiliza a **Clean Architecture** no backend para separar estritamente a interface, o controle de hardware e a lógica de jogo.
- **Frontend (Interface):** Renderização visual e captura de intenções.
- **Maestro (Infraestrutura/Hardware):** Controle absoluto do Sistema Operacional, I/O de disco e gerenciamento de memória de vídeo.
- **Sidecar (Inteligência):** Regras de negócio puras (Domain), RAG e orquestração de inferência (Use Cases e Adapters), rodando isolado sem depender de rede local.

## 4. COMPONENTES DA INFRAESTRUTURA E TECNOLOGIAS

### A. Frontend (Interface, HUD e UX)
- **Framework:** Tauri
- **Tecnologias:** React + JavaScript
- **Responsabilidade:** Renderizar o terminal de texto, Player HUD, Quest Log, mapas procedurais interativos (Canvas/WebGL) e formulários dinâmicos de setup.

### B. Maestro Backend (Orquestração e Hardware)
- **Tecnologias:** Rust + Tauri
- **Responsabilidade:** Atuar como o processo pai. Intercepta comandos, escreve logs assincronamente no SSD (Zero-Blocking), monitora a VRAM nativamente e gerencia o ciclo de vida do processo Python oculto via STDIN/STDOUT (IPC).

### C. AI Engine Sidecar (Lógica e Persistência)
- **Framework:** Python (compilado via Nuitka/PyInstaller).
- **Responsabilidade:** Processo invisível sem servidor HTTP. Recebe JSONs do Rust, executa as regras do RPG, interage com os bancos de dados e formata prompts para as IAs locais.
- **Banco de Dados Relacional/Estado:** SQLite (armazenamento de entidades, configurações, inventário e preferências).
- **Banco Vetorial (RAG):** ChromaDB local para indexação semântica e recuperação de memórias de longo prazo e marcos narrativos.

### D. Motores de Inferência (LLM / VLM)
- **Texto (LLM):** KoboldCPP (focado em GGUF com suporte eficiente a offload em GPUs AMD). Modelos como Llama-3.1-8B-Instruct (Q4_K_M).
- **Imagem (Diffusion):** ComfyUI em modo API. Modelos como SDXL Turbo ou FLUX.1 [schnell] (FP8). Utiliza IP-Adapter e LoRA para manter a identidade dos NPCs.

## 5. SISTEMA DE CONTEXTO LOCAL (ASSETS & METADATA)
Para garantir a verossimilhança do mundo, o sistema utiliza um diretório gerido pelo Rust e interpretado pelo Python:
* **/Assets/Scenery/** e **/Assets/Characters/**: Imagens e referências visuais locais.
* **/Metadata/**: Arquivos JSON com `tags`, `description` técnica e `style_prompt`.
* **/Global_Library/**: Presets exportados de NPCs e itens para reaproveitamento.
* **Atlas Local (SQLite):** Mapeia entidades ativas (`@Forest`, `@Merchant`) para injeção de fatos no prompt.

## 6. FLUXO DE EXECUÇÃO (TURN CYCLE & VRAM SWAP)
1. **Captura:** O jogador envia uma ação no React.
2. **Roteamento:** O Maestro (Rust) intercepta. Se for comando de sistema local (ex: `/load`), ele resolve. Se for ação de RPG, envia via `STDIN` para o Sidecar (Python).
3. **Contexto:** O Python lê o `STDIN`, consulta o SQLite (Atlas) e o ChromaDB (RAG) em busca de @tags e memórias.
4. **VRAM_Optimizer (Swap):** O Maestro (Rust) garante que a GPU esteja alocada para o KoboldCPP. O Python aciona a API do Kobold.
5. **Geração Visual:** Ao terminar o texto, o Rust aciona o flush da VRAM, descarrega o LLM e carrega o ComfyUI na GPU. O Python envia os prompts de imagem.
6. **Retorno:** O Python imprime o resultado final em `STDOUT`. O Rust lê, grava o log no disco e emite um evento atualizando o React.

## 7. PRINCIPAIS FUNÇÕES E MÓDULOS
- **`SidecarManager` (Rust):** Mantém o loop IPC com o Python e escuta erros fatais.
- **`VRAM_Optimizer` (Rust):** Monitora uso de GPU nativamente e sinaliza descarregamento para evitar OOM (Out-Of-Memory) nos 8GB da RX 7600.
- **`Logger` (Rust):** Captura strings do Python e formata com timestamps no SSD.
- **`VectorMemoryAdapter` (Python):** Centraliza a comunicação de persistência com o ChromaDB.

## 8. RESTRIÇÕES E ENGENHARIA DE COMPILAÇÃO
- **Limite de VRAM:** O uso da GPU não pode exceder 7.5GB. O Tauri/Rust gerencia a alternância dos motores.
- **Compilabilidade:** O backend Python não utiliza servidores web (FastAPI/Uvicorn) e deve ser inteiramente empacotado pelo Nuitka para rodar como um `.exe` binário, protegendo o código e reduzindo overhead.

## 9. COMO EXECUTAR (AMBIENTE DE DESENVOLVIMENTO)

Para rodar o projeto localmente com Hot-Reload da interface e isolamento lógico, utilize dois terminais. Assegure-se de que o KoboldCPP e o ComfyUI estejam rodando em background.

### Terminal 1: AI Engine (Python)
(Ideal para debugar a lógica de IA isoladamente antes de integrar à UI)
1. `python -m venv venv`
2. `.\venv\Scripts\activate`
3. `pip install -r requirements.txt`
4. `python src/main_dev.py` (simula as entradas e saídas no console)

### Terminal 2: Maestro & Interface (Rust + React)
1. `npm install`
2. `npm run tauri dev` (Compila o Rust, liga o React e invoca automaticamente o backend Python como processo filho).

### Build de Produção
1. Gere o executável Python (usando Nuitka).
2. Mova o `.exe` para `apps/frontend/src-ui/binaries/`.
3. Em `apps/frontend`, execute `npm run tauri build` para gerar o instalador final contendo toda a arquitetura integrada.