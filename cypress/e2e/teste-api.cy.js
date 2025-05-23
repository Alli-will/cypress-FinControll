describe('Testes da API de Contas', () => {
  const api = 'http://localhost:5000/contas';
  const tokenValido = 'masterkey';
  const tokenInvalido = 'masterke';
  let contaIdCriada;

  describe('Testes de Sucesso', () => {
    it('GET /contas - Deve retornar lista de contas com status 200', () => {
      cy.request({
        method: 'GET',
        url: api,
        headers: { 'x-api-token': tokenValido }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
        
        if (response.body.length > 0) {
          expect(response.body[0]).to.have.keys([
            'id', 'descricao', 'categoria', 'formapgto', 'valor', 'data'
          ]);
        }
      });
    });

    it('POST /contas - Deve criar nova conta com status 201', () => {
      const novaConta = {
        descricao: "X-quasetudo",
        categoria: "Alimentação",
        formapgto: "Bonificação",
        valor: 25.00
      };

      cy.request({
        method: 'POST',
        url: api,
        headers: { 'x-api-token': tokenValido },
        body: novaConta
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.include(novaConta);
        expect(response.body).to.have.property('id');
        expect(response.body).to.have.property('data');
        contaIdCriada = response.body.id;
      });
    });

    it('GET /contas/:id - Deve retornar detalhes da conta específica', () => {
      expect(contaIdCriada).to.be.a('number');
      expect(contaIdCriada).to.be.greaterThan(0)
      cy.request({
        method: 'GET',
        url: `${api}/${contaIdCriada}`,
        headers: { 'x-api-token': tokenValido },
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 404) {
        }
        expect(response.status).to.eq(200);
        expect(response.body.id).to.eq(contaIdCriada);
      });
    });

    it('PATCH /contas/:id - Deve atualizar conta existente', () => {
      const atualizacao = {
        descricao: "Internet",
        categoria: "Casa"
      };

      cy.request({
        method: 'GET',
        url: `${api}/${contaIdCriada}`,
        headers: { 'x-api-token': tokenValido },
        failOnStatusCode: false
      }).then((getResponse) => {
        if (getResponse.status !== 200) {
          throw new Error(`Conta com ID ${contaIdCriada} não existe para ser atualizada`);
        }

        cy.request({
          method: 'PATCH',
          url: `${api}/${contaIdCriada}`,
          headers: { 'x-api-token': tokenValido },
          body: atualizacao
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.descricao).to.eq(atualizacao.descricao);
        });
      });
    });

    it('GET /contas com filtros - Deve filtrar corretamente', () => {
      cy.request({
        method: 'GET',
        url: api,
        headers: { 'x-api-token': tokenValido },
        qs: {
          categoria: "Casa"
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
        response.body.forEach(conta => {
          expect(conta.categoria.toLowerCase()).to.eq('casa');
        });
      });
    });

    it('DELETE /contas/:id - Deve remover conta existente', () => {
      cy.request({
        method: 'GET',
        url: `${api}/${contaIdCriada}`,
        headers: { 'x-api-token': tokenValido },
        failOnStatusCode: false
      }).then((getResponse) => {
        if (getResponse.status !== 200) {
          throw new Error(`Conta com ID ${contaIdCriada} não existe para ser deletada`);
        }

        cy.request({
          method: 'DELETE',
          url: `${api}/${contaIdCriada}`,
          headers: { 'x-api-token': tokenValido },
          failOnStatusCode: false
        }).then((delResponse) => {
          expect(delResponse.status).to.be.oneOf([200]);
        });
      });
    });
  });

  describe('Testes de Erros', () => {
    it('GET /contas - Deve retornar 401 com token inválido', () => {
      cy.request({
        method: 'GET',
        url: api,
        headers: { 'x-api-token': tokenInvalido },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property('message');
      });
    });

    it('POST /contas - Deve retornar 400 para campos obrigatórios faltando', () => {
      cy.request({
        method: 'POST',
        url: api,
        headers: { 'x-api-token': tokenValido },
        body: { descricao: "Teste sem categoria" },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('message');
      });
    });

    it('POST /contas - Deve retornar 400 para tipos de dados inválidos', () => {
      cy.request({
        method: 'POST',
        url: api,
        headers: { 'x-api-token': tokenValido },
        body: {
          descricao: "Teste",
          categoria: "casa",
          formapgto: "Cartão",
          valor: "vinte" 
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('message');
      });
    });

    it('GET /contas/:id - Deve retornar 404 para ID inexistente', () => {
      const idInexistente = '700';
      cy.request({
        method: 'GET',
        url: `${api}/${idInexistente}`,
        headers: { 'x-api-token': tokenValido },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(404);
      });
    });

    it('PATCH /contas/:id - Deve retornar 404 para ID inexistente', () => {
      const idInexistente = '700';
      cy.request({
        method: 'PATCH',
        url: `${api}/${idInexistente}`,
        headers: { 'x-api-token': tokenValido },
        body: { descricao: "Teste" },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(404);
      });
    });

    it('DELETE /contas/:id - Deve retornar 404 para ID inexistente', () => {
      const idInexistente = '700';
      cy.request({
        method: 'DELETE',
        url: `${api}/${idInexistente}`,
        headers: { 'x-api-token': tokenValido },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(404);
      });
    });

    it('GET /contas/:id - Deve retornar 400 para ID inválido', () => {
      const idInvalido = 'abc123';
      cy.request({
        method: 'GET',
        url: `${api}/${idInvalido}`,
        headers: { 'x-api-token': tokenValido },
        failOnStatusCode: false
      }).then((response) => {   
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('message');
      });
    });
  });
});