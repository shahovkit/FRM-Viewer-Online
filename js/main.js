$(document).ready(function () {

  $('#frm_file').on('change', function (e) {
    if (e.target.files[0]) {
      loadFile(e.target.files[0]);
    }
  })

  let colors = [0, 108, 0, 11, 115, 7, 27, 123, 15, 43, 131, 27, 107, 107, 111, 99, 103, 127, 87, 107, 143, 0, 147, 163, 107, 187, 255, 255, 0, 0, 215, 0, 0 , 147, 43, 11, 255, 119, 0, 255, 59, 0, 71, 0, 0, 123, 0, 0, 179, 0, 0, 123, 0, 0, 71, 0, 0, 83, 63, 43, 75, 59, 43, 67, 55, 39, 63, 51, 39, 55, 47, 35, 51, 43, 35, 252, 0, 0 ]

  let rgbColors = [];
  let chunkSize = 3;
  for (let from = 0; from < colors.length; from+=chunkSize) {
    let to = from + chunkSize;
    rgbColors.push(colors.slice(from, to));
    
  }


  $('#play_button').on('change', function (e) {
    var currentFrame = parseInt($('#frame_picker').val());

    if (currentFrame+1 === FRMJson.framesPerDirection){
      updateFramePicker(0);
    }
    
    if (!e.currentTarget.checked) {
      stopAnimation()
    } else {
      if (FRMJson.fps)
        tickInterval = setInterval(tick, 1000 / FRMJson.fps)
      else
        tickInterval = setInterval(tick, 1000 / 12)
    }
  })

  $('#frame_picker').on('input', function (e) {
    updateFramePicker(
      e.currentTarget.value
    );
    updateFrame()
  })

  $('#direction_picker').on('input', function (e) {
    updateFrame();
    $('#direction_picker_label').text(
      e.currentTarget.value
    )
  })

  $('#center_picker').on('change', function (e) {
    updateFrame();
  })

  $('#color_picker').on('input', function (e) {
    $('#output').css('background', e.target.value)
  })

  $('#output').bind('wheel', function (event) {
    event.preventDefault();
    scale += event.originalEvent.wheelDelta / 1000
    if (scale < 1) {
      scale = 1;
    }
    ctx.setTransform(scale, 0, 0, scale, -(scale - 1) * (canvas.width / 2), -(scale - 1) * (canvas.width / 2 - 50));
    updateFrame();
  });

  $('#export_sequence').on('click', function () {
    exportSequence(FRMJson);
  })

  $('#export_atlas').on('click', function () {
    exportAtlas(FRMJson);
  })

});
