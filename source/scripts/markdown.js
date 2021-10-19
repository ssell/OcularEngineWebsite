// Markdown-to-HTML conversion using the showdownjs library.
// Dependency on: https://cdn.rawgit.com/showdownjs/showdown/1.4.3/dist/showdown.min.js

function loadMarkdown(name, id = "markdown")
{
    var path = "/ocular-engine/source/markdown/" + name + ".md";
    
    $.ajax({ url: path, async: false, success: function(content)
    {
        var converter = new showdown.Converter();
        converter.setOption('tables', 'true');

        var html = converter.makeHtml(content);

        
        $("#" + id).append(html);
    }});
}

$(document).ready(function() 
{
    // Automatically process all elements with the 'markdown' class.
    // The ids of these elements are expected to be the name of the markdown file.

    // Example:
    //
    //    <div id="about" class="markdown"></div>
    //
    // Attempts to parse the file '/source/markdown/about.md' and place
    // the contents inside the <div>
    
    $('.markdown').each(function() 
    {
        var id = this.id;
        loadMarkdown(id, id);
    });
});

