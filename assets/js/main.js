function coppied(element){
    console.log(element);
    element.style="background-color: #1ECD97;";
    element.innerHTML=`<i class="bi bi-clipboard-check" style="color: white;"></i></button>`;
    setTimeout(() => {
        element.innerHTML=`<i class="bi bi-clipboard"></i>`;
        element.style="";
    }, 500);
}