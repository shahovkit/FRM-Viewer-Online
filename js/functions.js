function fillInfo(FRMJson) {
    $('.filename').text(FRMJson.filename);
    $('#version').text(FRMJson.version);
    $('#fps').text(FRMJson.fps);
    $('#action_frame').text(FRMJson.actionFrame);
    $('#frames_per_direction').text(FRMJson.framesPerDirection);
    $('#shiftx_0').text(FRMJson.shift[0].x);
    $('#shiftx_1').text(FRMJson.shift[1].x);
    $('#shiftx_2').text(FRMJson.shift[2].x);
    $('#shiftx_3').text(FRMJson.shift[3].x)
    $('#shiftx_4').text(FRMJson.shift[4].x);
    $('#shiftx_5').text(FRMJson.shift[5].x);
    $('#shifty_0').text(FRMJson.shift[0].y);
    $('#shifty_1').text(FRMJson.shift[1].y);
    $('#shifty_2').text(FRMJson.shift[2].y);
    $('#shifty_3').text(FRMJson.shift[3].y)
    $('#shifty_4').text(FRMJson.shift[4].y);
    $('#shifty_5').text(FRMJson.shift[5].y);
    $('#mem_offset_0').text(FRMJson.offsetFrameArea[0]);
    $('#mem_offset_1').text(FRMJson.offsetFrameArea[1]);
    $('#mem_offset_2').text(FRMJson.offsetFrameArea[2]);
    $('#mem_offset_3').text(FRMJson.offsetFrameArea[3]);
    $('#mem_offset_4').text(FRMJson.offsetFrameArea[4]);
    $('#mem_offset_5').text(FRMJson.offsetFrameArea[5]);
    $('#size_framearea').text(FRMJson.frameAreaSize);

    fillInfoFrameDirection(0, 0)
}

function fillInfoFrameDirection(direction, frame) {
    $('#frame_width').text(FRMJson.directions[direction][frame].width);
    $('#frame_height').text(FRMJson.directions[direction][frame].height);
    $('#pixels').text(FRMJson.directions[direction][frame].totalPixels);
    $('#offset_x').text(FRMJson.directions[direction][frame].offset.x);
    $('#offset_y').text(FRMJson.directions[direction][frame].offset.y);
    $('#sum_offset_x').text(FRMJson.directions[direction][frame].totalOffset.x);
    $('#sum_offset_y').text(FRMJson.directions[direction][frame].totalOffset.y);
    $('#re_offset_x').text(FRMJson.directions[direction][frame].reOffset.x);
    $('#re_offset_y').text(FRMJson.directions[direction][frame].reOffset.y);
}

function FRMToJson(binary) {

    buffer = new BufferReader(binary);
    dataFRM = {
        filename: $('#frm_file').val().split(/(\\|\/)/g).pop().split(/(\.)/g).shift(),
        version: buffer.next(4).uint32(),
        fps: buffer.next(2).uint16(),
        actionFrame: buffer.next(2).uint16(),
        framesPerDirection: buffer.next(2).uint16(),
        shift: [],
        offsetFrameArea: [],
    }

    for (direction = 0; direction < 6; direction++) {
        dataFRM.shift[direction] = { x: buffer.next(2).int16() };
    }

    for (direction = 0; direction < 6; direction++) {
        dataFRM.shift[direction].y = buffer.next(2).int16();
    }

    for (direction = 0; direction < 6; direction++) { 
        dataFRM.offsetFrameArea.push(buffer.next(4).int32());
    }

    directions = dataFRM.offsetFrameArea[5] > 0 ? 6 : 1;

    dataFRM.frameAreaSize = buffer.next(4).int32();

    dataFRM['directions'] = [];

    for (direction = 0; direction < directions; direction++) {
        dataFRM['directions'][direction] = [];

        let totalOffset = { x: 0, y: 0 };
        for (frame = 0; frame < dataFRM.framesPerDirection; frame++) {

            dataFRM['directions'][direction][frame] = {};

            dataFRM['directions'][direction][frame]['width'] = buffer.next(2).uint16();
            dataFRM['directions'][direction][frame]['height'] = buffer.next(2).uint16()
            dataFRM['directions'][direction][frame]['totalPixels'] = buffer.next(4).uint32()
            dataFRM['directions'][direction][frame]['offset'] = {};
            dataFRM['directions'][direction][frame]['offset']['x'] = buffer.next(2).int16()
            dataFRM['directions'][direction][frame]['offset']['y'] = buffer.next(2).int16()

            totalOffset.x += dataFRM['directions'][direction][frame]['offset']['x'];
            totalOffset.y += dataFRM['directions'][direction][frame]['offset']['y'];

            dataFRM['directions'][direction][frame]['totalOffset'] = {};
            dataFRM['directions'][direction][frame]['totalOffset']['x'] = totalOffset.x;
            dataFRM['directions'][direction][frame]['totalOffset']['y'] = totalOffset.y;

            dataFRM['directions'][direction][frame]['reOffset'] = {x:totalOffset.x, y:totalOffset.y};

            let imageData = toImageData(
                buffer.next(dataFRM['directions'][direction][frame]['totalPixels']).uint8Array(),
                dataFRM['directions'][direction][frame]['width'],
                dataFRM['directions'][direction][frame]['height']
            );

            dataFRM['directions'][direction][frame]['imageData'] = imageData;
            dataFRM['directions'][direction][frame]['dataUrl'] = toDataURL(imageData)
        }
    }

    isMove = dataFRM.directions.length > 1 && Math.abs(dataFRM.directions[1][dataFRM.framesPerDirection-1].totalOffset.x) > 16;

    if(isMove) {
        reOffset(dataFRM);
    }
        
    return dataFRM;
}

function reOffset(FRMJson) {
    FRMJson.directions.forEach((frames, direction) => {
        frames.forEach((frame) => {
            let reOffset = {
                x: 0,
                y: frame.totalOffset.y - Math.round(frame.totalOffset.x * tangent[direction])
            }

            frame['reOffset']['x'] = reOffset.x;
            frame['reOffset']['y'] = reOffset.y;
        })
    })
}

function toImageData(pixels, width, height) {
    let imageData = ctx.createImageData(width, height);

    for (let rgba = 0; rgba < imageData.data.length; rgba += 4) {
        let currentPixel = rgba / 4;
        imageData.data[rgba + 0] = palette[pixels[currentPixel]][0] * 4;
        imageData.data[rgba + 1] = palette[pixels[currentPixel]][1] * 4;
        imageData.data[rgba + 2] = palette[pixels[currentPixel]][2] * 4;

        imageData.data[rgba + 3] = pixels[currentPixel] === 0 ? 0 : 255;
    }

    return imageData;
}

function toDataURL(imageData) {

    let imageCanvas = document.createElement("canvas");
    imageCanvas.width = imageData.width;
    imageCanvas.height = imageData.height
    imageCanvas.getContext("2d").putImageData(imageData, 0, 0);
    return imageCanvas.toDataURL();
}

function drawFrame(FRMJson, direction, frame) {

    let canvasCenter = {
        x: Math.round(canvas.width / 2),
        y: Math.round(canvas.height / 2)
    };

    let frameCenter = {
        x: (FRMJson.directions[direction][frame].width / 2) | 0,
        y: FRMJson.directions[direction][frame].height
    }

    let offset;
    if ($('#center_picker').prop('checked')) {
        offset = FRMJson.directions[direction][frame].reOffset;
    } else {
        offset = FRMJson.directions[direction][frame].totalOffset;
    }

    let position = {
        x: canvasCenter.x - frameCenter.x + offset.x + FRMJson.shift[direction].x,
        y: canvasCenter.y - frameCenter.y + offset.y + FRMJson.shift[direction].y
    }

    let image = new Image();
    image.onload = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawHex(canvasCenter);
        ctx.drawImage(image, position.x, position.y);
    };
    image.src = FRMJson.directions[direction][frame].dataUrl;
}

function drawHex(center) {

    let halfHeight = 8;
    let halfWidth = 16;

    let corners = [
        { "x": halfWidth, "y": -halfHeight / 2 },
        { "x": 0, "y": -halfHeight },
        { "x": -halfWidth, "y": -halfHeight / 2 },
        { "x": -halfWidth, "y": halfHeight / 2 },
        { "x": 0, "y": halfHeight },
        { "x": halfWidth, "y": halfHeight / 2 }
    ];

    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(center.x + corners[5].x, center.y + corners[5].y);

    corners.forEach(corner => {
        ctx.lineTo(center.x + corner.x, center.y + corner.y);
    });

    ctx.stroke();
}

function tick() {
    var currentFrame = parseInt($('#frame_picker').val());
    updateFrame()

    currentFrame += 1;
    if (currentFrame === FRMJson.framesPerDirection) {
        if ($('#is_repeat').is(":checked")) {
            currentFrame = 0
        } else {
            stopAnimation()
        }
    }
    updateFramePicker(currentFrame);

    
}

function loadFile(file) {
    let fr = new FileReader();

    fr.onload = function (event) {
        FRMJson = FRMToJson(event.target.result);

        console.log(FRMJson);
        fillInfo(FRMJson);
        initFramePicker(FRMJson);
        initDirectionsPicker(FRMJson)
        updateFramePicker(0);
        updateDirectionPicker(0);
        drawFrame(FRMJson, 0, 0);
        enableButtons();
    };

    fr.readAsArrayBuffer(file)
}

function stopAnimation() {
    clearInterval(tickInterval);
    $('#play_button').click()
}

function updateFrame() {
    fillInfoFrameDirection(
        $('#direction_picker').val(),
        $('#frame_picker').val()
    )
    drawFrame(
        FRMJson,
        $('#direction_picker').val(),
        $('#frame_picker').val()
    );
}

function initFramePicker(FRMJson) {
    $('#frame_picker').attr({
        "max": (FRMJson.framesPerDirection - 1)
    });
}


function initDirectionsPicker(FRMJson) {
    $('#direction_picker').attr({
        "max": (FRMJson.directions.length - 1)
    });
}


function updateDirectionPicker(direction) {
    $('#direction_picker').val(direction);
    $('#direction_picker_label').text(direction);
}

function updateFramePicker(frame) {
    $('#frame_picker').val(frame);
    $('#i_frms_val').text(+$('#frame_picker').val() + 1 + '/' + FRMJson.framesPerDirection);
}

function disableButtons() {
    document.getElementById('play_button').disabled = true
    document.getElementById('center_picker').disabled = true
    document.getElementById('is_repeat').disabled = true
    document.getElementById('frame_picker').disabled = true
    document.getElementById('direction_picker').disabled = true
}

function enableButtons() {
    document.getElementById('play_button').disabled = false
    document.getElementById('center_picker').disabled = false
    document.getElementById('is_repeat').disabled = false
    document.getElementById('frame_picker').disabled = false
    document.getElementById('direction_picker').disabled = false
}

function exportSequence(FRMJson) {
    var zip = new JSZip();
    let folder = zip.folder(".");

    FRMJson.directions.forEach((frames, direction) => {
        frames.forEach((frame, frameNumber) => {
            let dataUrl = frame.dataUrl;
            let base64 = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "");
            folder.file(FRMJson.filename + "-" + direction + "-" + frameNumber + ".png", base64, { base64: true });
        });
    });

    zip.generateAsync({ type: "blob" })
        .then(function (content) {
            saveAs(content, "Sequence_" + FRMJson.filename + ".zip");
        });
}

function exportAtlas(FRMJson) {

    let spritesheetHeight = 0;
    let spritesheetWidth = 0;
    let atlasJson = {
        framesPerDirection: FRMJson.framesPerDirection,
        fps: FRMJson.fps,
        actionFrame: FRMJson.actionFrame,
        frames: []
    };

    FRMJson.directions.forEach((frames, direction) => {
        frames.forEach((frame, frameNumber) => {

            atlasJson.frames.push({
                "filename": "dir" + direction + "/frame" + frameNumber,
                "frame": {
                    "x": spritesheetWidth,
                    "y": 0,
                    "w": frame.width,
                    "h": frame.height
                },
                "rotated": false,
                "trimmed": true,
                "spriteSourceSize": {
                    "x": frame.reOffset.x,
                    "y": frame.reOffset.y,
                    "w": frame.width,
                    "h": frame.height
                },
                "sourceSize": {
                    "w": frame.width,
                    "h": frame.height
                },
                "pivot": {
                    "x": 0.5,
                    "y": 1
                }
            });

            spritesheetWidth += frame.width;

            if (frame.height > spritesheetHeight) {
                spritesheetHeight = frame.height;
            }


        });
    });

    let imageCanvas = document.createElement("canvas");
    imageCanvas.width = spritesheetWidth;
    imageCanvas.height = spritesheetHeight

    let nextX = 0;

    FRMJson.directions.forEach((frames, direction) => {
        frames.forEach((frame, frameNumber) => {

            imageCanvas.getContext("2d").putImageData(frame.imageData, nextX, 0);
            nextX += frame.width;
        });
    });

    let dataUrl = imageCanvas.toDataURL();

    var zip = new JSZip();
    let folder = zip.folder(".");
    let base64 = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "");
    console.log(base64);
    folder.file(FRMJson.filename + ".png", base64, { base64: true });

    folder.file(FRMJson.filename + ".json", JSON.stringify(atlasJson));

    zip.generateAsync({ type: "blob" })
        .then(function (content) {
            saveAs(content, "Atlas_" + FRMJson.filename + ".zip");
        });
}
