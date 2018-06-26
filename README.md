 MATRUSP TCC 2016
================

Branch voltada para o _re_-desenvolvimento do MatrUSP.

| [Versão atual] | [Versão anterior] | [Documentação] |
|:--------------:|:-----------------:|:--------------:|

[Versão atual]: http://bcc.ime.usp.br/matrusp/
[Versão anterior]: http://bcc.ime.usp.br/matrusp_v1/
[Documentação]: http://matrusp.github.io/matrusp/js/docs/

Envolva-se
----------
Veja como [contribuir](https://github.com/matrusp/matrusp/wiki/Contribute) para o repositório.

Ou [navegue](https://github.com/matrusp/matrusp/wiki) pela Wiki do projeto.

Conheça os [contribuidores](CONTRIBUTORS.md) que tornaram o MatrUSP uma realidade.


FAQ
---

 - *Como o MatrUSP funciona?*

    Todo dia à meia-noite, nós rodamos um [script Python](py/parse_usp.py) que varre o JupiterWeb em busca de
    oferecimentos de disciplinas. Os dados são processados e convertidos em um arquivo JSON
    que é salvo em disco no servidor. Quando um usuário acessa o MatrUSP, transmitimos este arquivo.
    Toda a lógica de combinações de disciplinas é feita no cliente.
    
    
Licença
---
#### O MatrUSP, como fork do CAPIM, segue a mesma [licença](LICENSE.md):

A ideia original era fazer o CAPIM ser código-livre. Porém, as licenças mais
comuns (como a GPL) não atenderiam a algumas restrições que eu gostaria de
impor ao código. Portanto, aqui defino a licença do CAPIM:

1. É proibido qualquer tipo de retorno financeiro, direta ou indiretamente,
   como, por exemplo:
   - o uso de propagandas, divulgação, apoio, troca de favores ou serviços
   afins no próprio site do aplicativo, em qualquer site que leve ao aplicativo
   e em qualquer site relacionado ao aplicativo;
   - cobrar pela utilização do serviço ou qualquer serviço adicional;
   - a venda de informações dos usuários;
2. É proibido o acúmulo de informações pessoais dos usuários, exceto pelos
   próprios horários que eles mesmos salvarem com um identificador de escolha
   deles;
3. É proibida a promoção pessoal do(s) desenvolvedor(es), exceto por uma menção
   em uma janela discreta para esta finalidade. Esta janela só deve aparecer
   quando solicitada pelo usuário e deve conter crédito para todos os
   desenvolvedores envolvidos, atuais e passados;
4. São permitidos o desenvolvimento e distribuição independentes do projeto,
   contanto que seja mantida esta licença e seja usado outro nome para o
   projeto;
5. O código fonte deve ser disponibilizado em algum repositório público, cujo
   endereço deve ser promovido em algum lugar do aplicativo;
6. Toda alteração ao código também deve obedecer a esta licença.
-----
