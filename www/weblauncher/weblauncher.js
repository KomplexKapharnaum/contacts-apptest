// store APPHASH global scope
    // In Cordova -> needs to be persistent to avoid re-downloading app.zip each time
document.APPHASH = null;   

// Fetch zip, unzip and replace app.html    
    // In Cordova -> unzip the whole zip in persistent storage
    // In Cordova -> also fetch media files
document.UPDATEAPP = function(info) 
{   
    // App update
    //
    if (document.APPHASH == info.appzip.hash) console.log('App already up to date');
    else 
        fetch(info.appzip.url)
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
                                        // replace $BASEPATH$ with empty string (In Cordova -> replace with persistent storage path)
                                        text = text.replace(/\$BASEPATH\$/g, '');  

                                        // replace full document
                                        document.open();
                                        document.write(text);
                                        document.close();

                                        // update APPHASH
                                        document.APPHASH = info.appzip.hash;
                                    })
                                    .catch(error => {
                                        console.error('Error:', error);
                                    });
                            }
                        });
                    })
            })
    
    // Media update
    //
    //      In Cordova -> fetch media files
    //      ...
}

// Socketio 
var socket = io();
socket.on('update', function(appinfo) {
    console.log('update', appinfo);
    document.UPDATEAPP(appinfo);
})
