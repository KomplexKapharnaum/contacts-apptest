// store APPINFO global scope
document.APPINFO = {};
document.CURRENT_HASH = '';

// Fetch zip, unzip and replace app.html
function updateApp() 
{   
    if (document.CURRENT_HASH != document.APPINFO.appzip.hash) {
        fetch(document.APPINFO.appzip.url)
            .then(response => response.blob())
            .then(data => {
                const zipReader = new zip.ZipReader( new zip.BlobReader(data) );
                zipReader.getEntries()
                    .then(entries => {
                        console.log(entries);
                        entries.forEach(entry => {
                            if (entry.filename == 'app.html') {
                                entry.getData(new zip.TextWriter())
                                    .then(text => {
                                        // replace $BASEPATH$ with empty string 
                                        text = text.replace(/\$BASEPATH\$/g, '');  

                                        // replace full document
                                        document.open();
                                        document.write(text);
                                        document.close();

                                        // update CURRENT_HASH
                                        document.CURRENT_HASH = document.APPINFO.appzip.hash;
                                    })
                                    .catch(error => {
                                        console.error('Error:', error);
                                    });
                            }
                        });
                    })
            })
    }
    else {
        console.log('App already up to date');
    }
}

// Socketio 
var socket = io();

socket.on('update', function(appinfo) {
    console.log('update', appinfo);
    document.APPINFO = appinfo;
    updateApp();
})
