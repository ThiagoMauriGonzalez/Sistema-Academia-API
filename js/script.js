
function validarCPF(cpf) {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf === '') return false;

    // Elimina CPFs inválidos conhecidos
    if (cpf.length !== 11 ||
        cpf === "00000000000" || 
        cpf === "11111111111" || 
        cpf === "22222222222" || 
        cpf === "33333333333" || 
        cpf === "44444444444" || 
        cpf === "55555555555" || 
        cpf === "66666666666" || 
        cpf === "77777777777" || 
        cpf === "88888888888" || 
        cpf === "99999999999") {
        return false;
    }

    // Valida o 1º dígito verificador
    let add = 0;
    for (let i = 0; i < 9; i++) {
        add += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;

    // Valida o 2º dígito verificador
    add = 0;
    for (let i = 0; i < 10; i++) {
        add += parseInt(cpf.charAt(i)) * (11 - i);
    }
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;

    return true;
}

// Chama a função de validação de CPF no envio do formulário
document.querySelector("#cadastroForm").addEventListener("submit", function (event) {
    const cpf = document.getElementById("cpf").value;
    if (!validarCPF(cpf)) {
        event.preventDefault(); // Impede o envio do formulário
        alert("CPF inválido! Por favor, insira um CPF válido.");
    }
    else{
        alert("Cadastro realizado com sucesso...")
    }
});
