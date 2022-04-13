var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
});
function updateTooltip() {
  new bootstrap.Tooltip(document.querySelector('#copyid'),{
      title: `<em>Your ID is </em><b>${localStorage.id}</b>`,
      html: true
  });
}
updateTooltip();
function coppied(element) {
    element.style = "background-color: #1ECD97;";
    element.innerHTML = `<i class="bi bi-clipboard-check" style="color: white;"></i></button>`;
    setTimeout(() => {
        element.innerHTML = `<i class="bi bi-clipboard"></i>`;
        element.style = "";
    }, 500);
}

var modal = document.getElementById("popup-modal");

function changeModal(data) {
  let innerHTML = `<h2>${data.title}</h2>
  <p>${data.body}</p>`

  if (data.confirm)
    innerHTML += `<div class="button">
        <button class="deny" onclick="denial()">Deny</button>
        <button class="accept" onclick="accepting()">Accept</button>
      </div>`;
  modal.firstElementChild.innerHTML = innerHTML;
  modal.hidden = false;
}

let file_Input = document.querySelector('.file-input');
let droparea = document.querySelector('.file-drop-area');
// highlight drag area
file_Input.addEventListener('dragenter', function() {
  droparea.classList.add('is-active');
});
file_Input.addEventListener('click', function() {
  droparea.classList.add('is-active');
});

// back to normal state
file_Input.addEventListener('dragleave', function() {
  droparea.classList.remove('is-active');
});
file_Input.addEventListener('blur', function() {
  droparea.classList.remove('is-active');
});
file_Input.addEventListener('drop', function() {
  droparea.classList.remove('is-active');
});

// change inner text
file_Input.addEventListener('change', function() {
  var filesCount = this.files.length;
  let textContainer = this.previousElementSibling;
  if (filesCount === 1) {
    // if single file is selected, show file name
    var fileName = this.value.split('\\').pop();
    textContainer.innerText = fileName;
  } else {
    // otherwise show number of files
    textContainer.innerText=filesCount + ' files selected';
  }
});
