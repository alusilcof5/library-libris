const form = document.getElementById('contactForm');
const modal = document.getElementById('thankYouModal');
const responseDiv = document.getElementById('formResponse');

form.addEventListener('submit', function(e) {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
        alert('Por favor llena todos los campos.');
        return;
    }
    // Limpieza
    form.reset();

    responseDiv.textContent = "Gracias, " + name + ", tu mensaje ha sido enviado.";
    responseDiv.style.color = '#27ae60';
    responseDiv.style.backgroundColor = '#d3d3d3';
    responseDiv.style.padding = '10px';
    responseDiv.style.borderRadius = '5px';

    modal.style.display = 'block';

    // Limpia a los 3 seg
    setTimeout(function() {
        modal.style.display = 'none';
        responseDiv.textContent = "";
    }, 3000);
});

function closeModal() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

function cancelForm() {
    form.reset();
    responseDiv.textContent = "";
}
