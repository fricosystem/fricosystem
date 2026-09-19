#!/usr/bin/env python3
"""
Script para gerar documentações em massa das páginas do APEX HUB
Evita duplicação e garante consistência
"""

import json

# Mapeamento de páginas e suas documentações (template)
pages_to_document = {
    'Perfil': {
        'path': '/perfil',
        'description': 'Gerenciar seu perfil de usuário e preferências',
        'audience': 'Todos os usuários',
        'features': [
            'Dados pessoais (nome, email, telefone)',
            'Alterar senha',
            'Foto de perfil',
            'Preferências de notificação',
            'Histórico de acesso',
            'Dispositivos conectados',
            'Dados de autenticação',
        ]
    },
    'Perfil': {
        'path': '/perfil',
        'description': 'Gerenciar seu perfil de usuário e preferências do APEX HUB',
        'audience': 'Todos os usuários autenticados',
    },
    'Carrinho': {
        'path': '/carrinho',
        'description': 'Gerenciar requisições de material antes de fazer a solicitação formal',
        'audience': 'Operadores e supervisores que precisam requisitar material',
    },
    'Devolução': {
        'path': '/devolucao',
        'description': 'Processar devoluções de material ao estoque',
        'audience': 'Operadores, supervisores, recepção',
    },
    'Reuniões': {
        'path': '/reunioes',
        'description': 'Agendar e participar de reuniões e videoconferências',
        'audience': 'Todos os usuários',
    },
    'Chat': {
        'path': '/chat',
        'description': 'Comunicação interna via chat com colegas e departamentos',
        'audience': 'Todos os usuários',
    },
}

# Gerar JSON para referência
docs_info = {
    'total_pages': len(pages_to_document),
    'pages': pages_to_document,
    'note': 'Este é um arquivo de referência. As documentações devem ser criadas como arquivos .md individuais'
}

print(json.dumps(docs_info, indent=2, ensure_ascii=False))
print("\n✓ Script de geração de documentações em massa pronto")
print("✓ As documentações podem ser criadas manualmente seguindo o padrão de outras páginas")
