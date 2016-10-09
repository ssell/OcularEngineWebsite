function loadMarkdown(name, id = "markdown")
{
    var path = "/source/markdown/" + name + ".md";
    
    $.ajax({ url: path, async: false, success: function(content)
    {
        var converter = new showdown.Converter();
        var html = converter.makeHtml(content);

        $("#" + id).append(html);
    }});
}
