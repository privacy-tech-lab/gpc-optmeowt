/* 
This dark mode switch initializer is based on the origninal dark mode
switch code.
The main difference is here our page does not check for a darkSwitch elem,
instead electing to simply add the dark switch tag to the body and setting
the intitial CSS attributes.

The current implementation does not benefit with this script a whole lot, 
if the white background issue is not fixed this can probably be removed.
*/
(function () {
  //console.log("Initializing dark mode switch...")
  function initThemeAttr() {
    var darkThemeSelected =
      localStorage.getItem("darkSwitch") !== null &&
      localStorage.getItem("darkSwitch") === "dark";
    darkThemeSelected
      ? document.body.setAttribute("data-theme", "dark")
      : document.body.removeAttribute("data-theme");
  }
  initThemeAttr();
})();
