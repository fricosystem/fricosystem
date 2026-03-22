import pandas as pd
import requests
from bs4 import BeautifulSoup
import time
import random
import os
from googlesearch import search
import re
import logging 
import tkinter as tk
from tkinter import filedialog

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def load_excel_file(file_path):
    """Carrega o arquivo Excel e retorna um DataFrame"""
    try:
        logger.info(f"Carregando arquivo Excel: {file_path}")
        df = pd.read_excel(file_path)
        logger.info(f"Arquivo carregado com sucesso. Colunas encontradas: {df.columns.tolist()}")
        return df
    except Exception as e:
        logger.error(f"Erro ao carregar o arquivo Excel: {e}")
        raise

def clean_product_name(product_name):
    """Limpa o nome do produto para melhorar os resultados da busca"""
    if not isinstance(product_name, str):
        return ""
    # Remove caracteres especiais e códigos internos
    cleaned = re.sub(r'[^\w\s]', ' ', product_name)
    # Remove palavras muito genéricas ou códigos
    cleaned = re.sub(r'\b(?:[A-Z0-9]{2,8})\b', '', cleaned)
    # Remove espaços extras
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

def search_product_price(product_name, max_results=3):
    """Busca o preço de um produto na web usando Google Search"""
    if not product_name or not isinstance(product_name, str) or len(product_name.strip()) < 3:
        logger.warning(f"Nome de produto inválido: '{product_name}'")
        return None
    
    clean_name = clean_product_name(product_name)
    if not clean_name:
        logger.warning(f"Nome de produto vazio após limpeza: '{product_name}'")
        return None
    
    search_query = f"{clean_name} preço"
    logger.info(f"Buscando: {search_query}")
    
    prices = []
    try:
        # Usar a biblioteca googlesearch para obter URLs
        search_results = list(search(search_query, num=max_results, stop=max_results, pause=2))
        
        for url in search_results:
            try:
                logger.info(f"Acessando URL: {url}")
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
                response = requests.get(url, headers=headers, timeout=10)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Procura por padrões de preço no HTML
                price_patterns = [
                    r'R\$\s*[\d.,]+',  # R$ 99,99
                    r'[\d.,]+\s*reais',  # 99,99 reais
                    r'preço[\s:]*R\$\s*[\d.,]+',  # preço: R$ 99,99
                    r'valor[\s:]*R\$\s*[\d.,]+',  # valor: R$ 99,99
                ]
                
                # Procura no texto da página
                page_text = soup.get_text()
                for pattern in price_patterns:
                    matches = re.findall(pattern, page_text, re.IGNORECASE)
                    for match in matches:
                        # Extrai o valor numérico
                        price_str = re.search(r'[\d.,]+', match).group(0)
                        price_str = price_str.replace('.', '').replace(',', '.')
                        try:
                            price = float(price_str)
                            if 0.1 < price < 1000000:  # Filtra valores muito baixos ou muito altos
                                prices.append(price)
                        except ValueError:
                            continue
                
                # Procura também em elementos que geralmente contêm preços
                price_elements = soup.select('.price, .product-price, .valor, .preco, [itemprop="price"]')
                for element in price_elements:
                    element_text = element.get_text().strip()
                    price_match = re.search(r'[\d.,]+', element_text)
                    if price_match:
                        price_str = price_match.group(0).replace('.', '').replace(',', '.')
                        try:
                            price = float(price_str)
                            if 0.1 < price < 1000000:
                                prices.append(price)
                        except ValueError:
                            continue
                
            except Exception as e:
                logger.warning(f"Erro ao processar URL {url}: {e}")
                continue
                
            # Pausa entre requisições para não sobrecarregar os servidores
            time.sleep(random.uniform(1, 3))
            
        # Se encontrou preços, retorna a média
        if prices:
            # Remove valores muito discrepantes (fora de 1.5x o desvio padrão)
            if len(prices) > 3:
                mean = sum(prices) / len(prices)
                std_dev = (sum((x - mean) ** 2 for x in prices) / len(prices)) ** 0.5
                filtered_prices = [p for p in prices if abs(p - mean) <= 1.5 * std_dev]
                if filtered_prices:
                    prices = filtered_prices
            
            avg_price = sum(prices) / len(prices)
            logger.info(f"Preço médio encontrado para '{product_name}': R$ {avg_price:.2f}")
            return avg_price
        else:
            logger.warning(f"Nenhum preço encontrado para '{product_name}'")
            return None
            
    except Exception as e:
        logger.error(f"Erro ao buscar preço para '{product_name}': {e}")
        return None

def update_prices_in_excel(df, output_file):
    """Atualiza os preços na planilha e salva um novo arquivo"""
    total_items = len(df)
    updated_count = 0
    not_found_count = 0
    already_processed = 0
    
    # Perguntar onde salvar o arquivo final
    root = tk.Tk()
    root.withdraw()
    output_file = filedialog.asksaveasfilename(
        title="Salvar arquivo atualizado como",
        defaultextension=".xlsx",
        initialfile=os.path.basename(output_file),
        filetypes=[("Arquivos Excel", "*.xlsx"), ("Todos os arquivos", "*.*")]
    )
    
    # Verificar se o usuário cancelou a operação
    if not output_file:
        print("Operação de salvamento cancelada pelo usuário.")
        return False
    
    # Verificar se o arquivo de saída já existe (para retomar o processamento)
    resumed = False
    if os.path.exists(output_file):
        try:
            print(f"\nArquivo de saída já existe. Verificando produtos já processados...")
            existing_df = pd.read_excel(output_file)
            
            # Verificar quais produtos já foram processados (têm preço válido)
            processed_products = {}
            for idx, row in existing_df.iterrows():
                product_code = row['CODIGO ESTOQUE']
                product_name = row['TEXTO BREVE']
                price = row['PRECO']
                
                if pd.notna(price) and price > 0:
                    processed_products[product_code] = price
            
            if processed_products:
                print(f"Encontrados {len(processed_products)} produtos já processados.")
                
                # Atualizar os preços já processados no DataFrame atual
                for idx, row in df.iterrows():
                    product_code = row['CODIGO ESTOQUE']
                    if product_code in processed_products:
                        df.at[idx, 'PRECO'] = processed_products[product_code]
                        already_processed += 1
                
                resumed = True
                print(f"Retomando processamento a partir de onde parou anteriormente.")
            else:
                print("Nenhum produto processado encontrado no arquivo existente.")
                
        except Exception as e:
            print(f"Erro ao verificar arquivo existente: {e}")
            print("Iniciando processamento do zero.")
    
    # Processar os produtos
    for index, row in df.iterrows():
        try:
            # Obter o nome do produto e o código
            product_name = row['TEXTO BREVE']
            product_code = row['CODIGO ESTOQUE']
            current_price = row['PRECO']
            
            # Pular produtos já processados
            if resumed and pd.notna(current_price) and current_price > 0:
                print(f"Pulando item {index+1}/{total_items}: {product_name} - já processado (R$ {current_price:.2f})")
                continue
            
            # Status de progresso
            logger.info(f"Processando item {index+1}/{total_items}: {product_name}")
            print(f"Processando item {index+1}/{total_items}: {product_name}")
            
            # Buscar o preço (com tratamento para produtos sem nome válido)
            if pd.isna(product_name) or not isinstance(product_name, str) or len(product_name.strip()) < 3:
                logger.warning(f"Nome de produto inválido no índice {index}: '{product_name}'")
                print(f"  ❌ Nome de produto inválido: '{product_name}'")
                not_found_count += 1
                continue
                
            price = search_product_price(product_name)
            
            # Atualizar o preço se encontrado
            if price is not None:
                df.at[index, 'PRECO'] = price
                updated_count += 1
                print(f"  ✅ Preço encontrado: R$ {price:.2f}")
                
                # Salvar o arquivo após cada atualização bem-sucedida
                try:
                    df.to_excel(output_file, index=False)
                    logger.info(f"Progresso salvo: {output_file}")
                except Exception as e:
                    logger.error(f"Erro ao salvar progresso: {e}")
            else:
                not_found_count += 1
                print(f"  ❌ Preço não encontrado")
                
            # Pausa aleatória entre buscas
            time.sleep(random.uniform(0.5, 2))
            
        except Exception as e:
            logger.error(f"Erro ao processar item {index}: {e}")
            print(f"  ❌ Erro: {e}")
            continue
    
    # Salvar o arquivo atualizado final
    try:
        df.to_excel(output_file, index=False)
        logger.info(f"Arquivo salvo com sucesso: {output_file}")
        print(f"\nArquivo salvo com sucesso: {output_file}")
        print(f"\nResumo: {updated_count} preços atualizados, {not_found_count} preços não encontrados, {already_processed} produtos já processados anteriormente")
        return True
    except Exception as e:
        logger.error(f"Erro ao salvar o arquivo final: {e}")
        print(f"Erro ao salvar o arquivo final: {e}")
        return False

def main():
    try:
        print("=" * 60)
        print("SISTEMA DE ATUALIZAÇÃO DE PREÇOS COM BASE NA WEB")
        print("=" * 60)
        
        # Inicializar Tkinter
        root = tk.Tk()
        root.withdraw()  # Oculta a janela principal
        
        print("Selecione o arquivo Excel (xlsx) no explorador de arquivos...")
        
        # Abrir o explorador de arquivos para selecionar o arquivo Excel
        file_path = filedialog.askopenfilename(
            title="Selecione o arquivo Excel",
            filetypes=[("Arquivos Excel", "*.xlsx"), ("Todos os arquivos", "*.*")]
        )
        
        # Verificar se o usuário cancelou a seleção
        if not file_path:
            print("Nenhum arquivo foi selecionado. Operação cancelada.")
            return
            
        print(f"Arquivo selecionado: {file_path}")
        
        # Verificar se o arquivo existe
        if not os.path.exists(file_path):
            print(f"Erro: O arquivo '{file_path}' não foi encontrado.")
            return
        
        # Carregar o arquivo Excel
        df = load_excel_file(file_path)
        
        # Verificar se as colunas necessárias existem
        required_columns = ['CODIGO ESTOQUE', 'TEXTO BREVE', 'PRECO']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            print(f"Erro: As seguintes colunas necessárias não foram encontradas: {', '.join(missing_columns)}")
            return
        
        # Definir o nome do arquivo de saída
        file_dir = os.path.dirname(file_path)
        file_name = os.path.basename(file_path)
        output_file = os.path.join(file_dir, f"atualizado_{file_name}")
        
        # Confirmar com o usuário
        print("\nInformações do arquivo:")
        print(f"Total de produtos: {len(df)}")
        print(f"Colunas encontradas: {', '.join(df.columns.tolist())}")
        print(f"\nAVISO: Este processo pode levar tempo e depende de conexão com a internet.")
        
        confirm = input("\nDeseja continuar? (s/n): ")
        if confirm.lower() != 's':
            print("Operação cancelada pelo usuário.")
            return
        
        # Definir número máximo de produtos a processar (para evitar bloqueios)
        max_products = input("\nQuantos produtos deseja processar (deixe em branco para todos): ")
        if max_products.strip():
            try:
                max_products = int(max_products)
                df = df.head(max_products)
                print(f"Processando os primeiros {max_products} produtos.")
            except ValueError:
                print("Valor inválido. Processando todos os produtos.")
        
        print("\nIniciando busca de preços...")
        
        # Atualizar os preços
        update_prices_in_excel(df, output_file)
        
        print("\nProcesso concluído!")
        
    except Exception as e:
        print(f"Erro durante a execução: {e}")
        logger.error(f"Erro durante a execução: {e}", exc_info=True)

if __name__ == "__main__":
    main()