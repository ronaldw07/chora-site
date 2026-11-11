// The Download buttons start the download and bring you to the install steps,
// so the file and the instructions for it arrive together.
document.querySelectorAll("[data-download]").forEach((link) => {
  link.addEventListener("click", () => {
    document.getElementById("install").scrollIntoView();
  });
});
