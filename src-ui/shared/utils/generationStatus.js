function normalizeLog(message) {
  return message
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function isGenerationErrorMessage(message) {
  if (typeof message !== 'string') {
    return false;
  }

  const normalized = normalizeLog(message);
  return normalized.startsWith('erro')
    || normalized.includes('falha')
    || normalized.includes('nao esta disponivel')
    || normalized.includes('nao foi processada')
    || normalized.includes('nao foi possivel');
}

export function getGenerationStatus(message, currentStage = 'narrative') {
  if (typeof message !== 'string') {
    return null;
  }

  const log = normalizeLog(message);

  if (log.includes('[error]') || log.includes('[critical]')) {
    return {
      phase: 'error',
      stage: 'error',
      message: log.includes('comfyui') || log.includes('imagem')
        ? 'Não foi possível concluir a geração da imagem.'
        : 'Ocorreu um problema durante a geração da rodada.',
    };
  }

  if (log.includes('iniciando kobold')) {
    return { stage: 'narrative', message: 'Preparando o motor de narrativa...' };
  }
  if (log.includes('iniciando comfyui')) {
    return { stage: 'image', message: 'Alternando para o motor de imagens...' };
  }
  if (log.includes('desalocando kobold')) {
    return { stage: 'image', message: 'Liberando recursos para preparar a imagem...' };
  }
  if (log.includes('alocando eixo do comfyui')) {
    return { stage: 'image', message: 'Iniciando o motor de geração de imagens...' };
  }
  if (log.includes('alocando eixo do kobold')) {
    return { stage: 'narrative', message: 'Alternando para o motor de narrativa...' };
  }
  if (log.includes('aguardando o servico') && log.includes('inicializar')) {
    const isImageEngine = log.includes('8188') || currentStage === 'image';
    return {
      stage: isImageEngine ? 'image' : 'narrative',
      message: isImageEngine
        ? 'Aguardando o motor de imagens ficar pronto...'
        : 'Aguardando o motor de IA ficar pronto...',
    };
  }
  if (log.includes('pronto para receber requisicoes')) {
    return {
      stage: currentStage,
      message: 'Motor pronto. Preparando a próxima etapa...',
    };
  }
  if (log.includes('solicitando geracao de texto a llm')) {
    return {
      stage: currentStage,
      message: currentStage === 'image'
        ? 'Requisição aceita. Extraindo os detalhes visuais da cena...'
        : currentStage === 'analysis'
          ? 'Requisição enviada. Analisando a rodada...'
          : 'Requisição enviada. Gerando a narrativa...',
      isNarrativeRequest: currentStage === 'narrative',
    };
  }
  if (log.includes('iniciando extracao analitica')) {
    return { stage: 'analysis', message: 'Narrativa pronta. Analisando a rodada...' };
  }
  if (log.includes('aguardando analise da rodada terminar')) {
    return { stage: 'analysis', message: 'Finalizando a análise antes de gerar a imagem...' };
  }
  if (log.includes('iniciando extracao de tags de imagem')) {
    return { stage: 'image', message: 'Preparando a descrição visual da cena...' };
  }
  if (log.includes('prompts de imagem extraidos com sucesso')) {
    return { stage: 'image', message: 'Descrição visual pronta. Preparando o envio da imagem...' };
  }
  if (log.includes('request aceito. ticket da fila')) {
    return { stage: 'image', message: 'Requisição aceita. Gerando a imagem da cena...' };
  }
  if (log.includes('imagem gerada com sucesso pelo comfyui')) {
    return { stage: 'image', message: 'Imagem pronta. Finalizando a rodada...' };
  }
  if (log.includes('sistema pronto para nova rodada')) {
    return {
      stage: 'image',
      message: 'Imagem concluída. Finalizando a rodada...',
      isRoundComplete: true,
    };
  }
  if (log.includes('texto gerado com sucesso pela llm') && currentStage === 'narrative') {
    return { stage: 'narrative', message: 'Narrativa gerada. Preparando a análise da rodada...' };
  }

  return null;
}
