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
let bs_modal = new bootstrap.Modal(modal);
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