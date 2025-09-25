interface ElementChanges {
  text?: string;
  styles: Record<string, string>;
  className?: string;
}

interface ComponentLocation {
  filePath: string;
  startLine: number;
  endLine: number;
  componentName: string;
}

class CodeParserService {
  /**
   * Analisa um elemento selecionado e tenta localizar seu componente correspondente
   */
  async findComponentLocation(elementId: string, tagName: string): Promise<ComponentLocation | null> {
    try {
      // Esta seria a implementação real que analisaria o código
      // Por enquanto, retorna um exemplo
      return {
        filePath: 'src/components/ExampleComponent.tsx',
        startLine: 10,
        endLine: 50,
        componentName: 'ExampleComponent'
      };
    } catch (error) {
      console.error('Erro ao localizar componente:', error);
      return null;
    }
  }

  /**
   * Gera as alterações de código necessárias baseadas nas mudanças do elemento
   */
  generateCodeChanges(changes: ElementChanges, location: ComponentLocation): string {
    // Esta seria a implementação real usando AST parsing
    // Por enquanto, retorna um exemplo de código alterado
    
    const styleChanges = Object.entries(changes.styles)
      .map(([property, value]) => `${this.camelCase(property)}: '${value}'`)
      .join(',\n    ');

    const exampleCode = `
// Alterações sugeridas para ${location.componentName}
const updatedStyles = {
  ${styleChanges}
};

// Texto atualizado: ${changes.text || 'Sem alterações de texto'}
`;

    return exampleCode;
  }

  /**
   * Aplica as mudanças no arquivo especificado
   */
  async applyChangesToFile(filePath: string, changes: string): Promise<boolean> {
    try {
      // Esta seria a implementação real que modificaria o arquivo
      // Integraria com o githubService para fazer commit das mudanças
      console.log(`Aplicando mudanças em ${filePath}:`, changes);
      return true;
    } catch (error) {
      console.error('Erro ao aplicar mudanças no arquivo:', error);
      return false;
    }
  }

  /**
   * Converte CSS property names para camelCase
   */
  private camelCase(str: string): string {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  /**
   * Analisa JSX/TSX para encontrar elementos específicos
   */
  parseJSX(code: string): any[] {
    // Esta seria a implementação usando @babel/parser
    // Por enquanto, retorna um array vazio
    return [];
  }

  /**
   * Gera CSS baseado nas mudanças de estilo
   */
  generateCSS(styles: Record<string, string>): string {
    return Object.entries(styles)
      .map(([property, value]) => `  ${property}: ${value};`)
      .join('\n');
  }

  /**
   * Detecta se o elemento usa CSS Modules, Styled Components ou Tailwind
   */
  detectStylingMethod(className: string): 'tailwind' | 'css-modules' | 'styled-components' | 'inline' {
    if (className?.includes('_')) return 'css-modules';
    if (className?.includes('sc-')) return 'styled-components';
    if (className?.match(/^[a-z-]+$/)) return 'tailwind';
    return 'inline';
  }

  /**
   * Converte mudanças de estilo para classes Tailwind equivalentes
   */
  convertToTailwind(styles: Record<string, string>): string[] {
    const tailwindClasses: string[] = [];
    
    Object.entries(styles).forEach(([property, value]) => {
      switch (property) {
        case 'color':
          // Simplificado - na implementação real seria mais robusto
          if (value === '#ffffff') tailwindClasses.push('text-white');
          break;
        case 'background-color':
          if (value === '#000000') tailwindClasses.push('bg-black');
          break;
        case 'font-size':
          const size = parseInt(value);
          if (size === 16) tailwindClasses.push('text-base');
          break;
        // Adicionar mais conversões conforme necessário
      }
    });

    return tailwindClasses;
  }
}

export const codeParserService = new CodeParserService();