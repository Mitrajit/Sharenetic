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

var modal = document.getElementById("popup");
function removeBackdrops(){
    Array.from(document.querySelectorAll(".modal-backdrop")).forEach(element=>element.remove());
}
function changeModal(data) {
    removeBackdrops();
    let innerHTML =  `<div class="modal-content">
    <div class="modal-header">
        <h5 class="modal-title">${data.title}</h5>
    </div>
    <div class="modal-body">
        ${data.body}</div>`;
    if (data.confirm)
        innerHTML += `<div class="modal-footer"><button class="btn btn-primary" data-bs-dismiss="modal" onclick="sendChannel.send(JSON.stringify({confirmed:true})); removeBackdrops()">Confirm</button>
        <button class="btn btn-danger" data-bs-dismiss="modal" onclick="sendChannel.send(JSON.stringify({confirmed:false})); downloadInProgress=false; removeBackdrops();">Deny</button>
    </div>`;
    modal.firstElementChild.innerHTML = innerHTML+`</div>`;
    if(data.confirm)
    new bootstrap.Modal(modal,{backdrop:'static',keyboard:false}).toggle();
    else
    bs_modal.toggle();
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
