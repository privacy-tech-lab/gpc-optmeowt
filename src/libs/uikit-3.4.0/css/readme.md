# Changes made to uikit.min.css
In order to make the [Dark Mode Switch](https://github.com/coliff/dark-mode-switch)
work and create a smooth effect between the main page and the background color, 
I commented out `/* background:#fff; */` in order to have it auto-fill by the
[Dark Mode Switch](https://github.com/coliff/dark-mode-switch). 

My assumption was that this would be the easiest solution to a persistent white 
background when scrolling up on a static page in google Chrome (other browsers
might not have this issue). If the need to change this comes up, it might be better
to find a patch somehwere else instead of changing the UIKit source code. 