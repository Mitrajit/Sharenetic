function closeModal() {
  document.getElementById("popup-modal").hidden = true;
}
function denial() {
  sendChannel.send(JSON.stringify({ confirmed: false })); downloadInProgress = false; closeModal();
}
function accepting() {
  endChannel.send(JSON.stringify({ confirmed: true })); closeModal();
}
window.onclick = function (event) {
  let modal = document.getElementById("popup-modal");
  if (event.target == modal) { closeModal(); }
};