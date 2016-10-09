// Creates, and automatically updates, the polygon background using the trianglify library.
// Dependency on: https://cdnjs.cloudflare.com/ajax/libs/trianglify/0.4.0/trianglify.min.js

function createBackground(element)
{
    var pattern = Trianglify(
    {
        width: window.innerWidth,
        height: window.innerHeight,
        variance: "0.75",
        cell_size: 115,
        x_colors: "GnBu"
    });

    var patternURL = pattern.canvas().toDataURL("image/png");

    $(element).css("background-image", "url(" + patternURL + ")");
}

$(document).ready(function()
{
    createBackground("body");

    $(window).on("resize", function()
    {
        createBackground("body");
    });
});
