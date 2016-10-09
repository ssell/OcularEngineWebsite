function loadMarkdown(name)
{
    var path = "/source/markdown/" + name + ".md";
    
    $.ajax({ url: path, success: function(content)
    {
        var converter = new showdown.Converter();
        var html = converter.makeHtml(content);

        $("#markdown").append(html);
    }});
}
