import { useEffect } from 'react';

/**
 * Hook para corrigir o erro DataCloneError relacionado ao postMessage
 * Intercepta e sanitiza objetos que não podem ser clonados (como Request objects)
 */
export const usePostMessageFix = () => {
  useEffect(() => {
    // Verifica se já foi aplicado o patch
    if ((window as any).__postMessagePatched) {
      return;
    }

    // Salva a função original
    const originalPostMessage = window.postMessage;
    const originalFetch = window.fetch;
    
    // Intercepta e sanitiza todas as chamadas de postMessage do script externo
    const interceptFrameMessages = () => {
      // Intercepta mensagens de todos os frames
      const frameWindows = [window.parent, window.top];
      frameWindows.forEach(frameWindow => {
        if (frameWindow && frameWindow !== window) {
          try {
            const originalFramePostMessage = frameWindow.postMessage;
            frameWindow.postMessage = function(message: any, targetOriginOrOptions: string | WindowPostMessageOptions, transfer?: Transferable[]) {
              try {
                const sanitizedData = sanitizeData(message);
                if (typeof targetOriginOrOptions === 'string') {
                  return originalFramePostMessage.call(this, sanitizedData, targetOriginOrOptions, transfer);
                } else {
                  return originalFramePostMessage.call(this, sanitizedData, targetOriginOrOptions);
                }
              } catch (error) {
                console.warn('Erro ao sanitizar dados para frame postMessage:', error);
                const errorMessage = {
                  error: 'DataCloneError',
                  message: 'Dados sanitizados automaticamente'
                };
                if (typeof targetOriginOrOptions === 'string') {
                  return originalFramePostMessage.call(this, errorMessage, targetOriginOrOptions);
                } else {
                  return originalFramePostMessage.call(this, errorMessage, targetOriginOrOptions);
                }
              }
            };
          } catch (error) {
            // Ignora erros de cross-origin
          }
        }
      });
    };

    // Função melhorada para sanitizar dados que não podem ser clonados
    const sanitizeData = (data: any): any => {
      if (data === null || data === undefined) {
        return data;
      }

      // Se é um Request object, converte para um objeto serializável
      if (data instanceof Request) {
        return {
          url: data.url,
          method: data.method,
          headers: Object.fromEntries(data.headers.entries()),
          _type: 'Request'
        };
      }

      // Se é um Response object, converte para um objeto serializável
      if (data instanceof Response) {
        return {
          url: data.url,
          status: data.status,
          statusText: data.statusText,
          headers: Object.fromEntries(data.headers.entries()),
          _type: 'Response'
        };
      }

      // Se é um Error object
      if (data instanceof Error) {
        return {
          name: data.name,
          message: data.message,
          stack: data.stack,
          _type: 'Error'
        };
      }

      // Se é um File object
      if (data instanceof File) {
        return {
          name: data.name,
          size: data.size,
          type: data.type,
          lastModified: data.lastModified,
          _type: 'File'
        };
      }

      // Se é um Blob object
      if (data instanceof Blob) {
        return {
          size: data.size,
          type: data.type,
          _type: 'Blob'
        };
      }

      // Se é um ArrayBuffer ou TypedArray
      if (data instanceof ArrayBuffer) {
        return {
          byteLength: data.byteLength,
          _type: 'ArrayBuffer'
        };
      }
      
      if (ArrayBuffer.isView(data)) {
        return {
          byteLength: data.byteLength,
          _type: 'TypedArray'
        };
      }

      // Se é uma função
      if (typeof data === 'function') {
        return {
          name: data.name || 'anonymous',
          _type: 'Function'
        };
      }

      // Se é um array, sanitiza cada item
      if (Array.isArray(data)) {
        return data.map(sanitizeData);
      }

      // Se é um objeto, sanitiza suas propriedades
      if (typeof data === 'object') {
        const sanitized: any = {};
        for (const key in data) {
          try {
            sanitized[key] = sanitizeData(data[key]);
          } catch (error) {
            // Se não conseguir serializar, ignora a propriedade
            console.warn(`Não foi possível serializar propriedade ${key}:`, error);
          }
        }
        return sanitized;
      }

      return data;
    };

    // Patch para postMessage
    window.postMessage = function(message: any, targetOriginOrOptions: string | WindowPostMessageOptions, transfer?: Transferable[]) {
      try {
        // Tenta primeiro com os dados originais
        if (typeof targetOriginOrOptions === 'string') {
          return originalPostMessage.call(this, message, targetOriginOrOptions, transfer);
        } else {
          return originalPostMessage.call(this, message, targetOriginOrOptions);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'DataCloneError') {
          console.warn('DataCloneError detectado, sanitizando dados:', error);
          try {
            const sanitizedData = sanitizeData(message);
            if (typeof targetOriginOrOptions === 'string') {
              return originalPostMessage.call(this, sanitizedData, targetOriginOrOptions, transfer);
            } else {
              return originalPostMessage.call(this, sanitizedData, targetOriginOrOptions);
            }
          } catch (sanitizeError) {
            console.error('Erro ao sanitizar dados para postMessage:', sanitizeError);
            // Como último recurso, envia apenas uma mensagem de erro
            const errorMessage = {
              error: 'DataCloneError',
              message: 'Dados não puderam ser clonados',
              originalError: error.message
            };
            if (typeof targetOriginOrOptions === 'string') {
              return originalPostMessage.call(this, errorMessage, targetOriginOrOptions);
            } else {
              return originalPostMessage.call(this, errorMessage, targetOriginOrOptions);
            }
          }
        }
        throw error;
      }
    };

    // Patch para fetch para evitar que Request objects sejam passados incorretamente
    window.fetch = function(...args: any[]) {
      try {
        return originalFetch.apply(this, args);
      } catch (error) {
        console.error('Erro no fetch:', error);
        throw error;
      }
    };

    // Aplica interceptação de mensagens de frames
    interceptFrameMessages();

    // Intercepta XMLHttpRequest também
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(...args: any[]) {
      try {
        return originalXHROpen.apply(this, args);
      } catch (error) {
        console.warn('Erro no XMLHttpRequest:', error);
        throw error;
      }
    };

    // Marca que o patch foi aplicado
    (window as any).__postMessagePatched = true;

    // Cleanup function
    return () => {
      window.postMessage = originalPostMessage;
      window.fetch = originalFetch;
      delete (window as any).__postMessagePatched;
    };
  }, []);
};