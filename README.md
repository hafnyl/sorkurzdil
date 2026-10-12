the game is called sul|fir or sulfir or sulfur but in the code its called sorkurzdil

known bugs
- i think sometimes two garbage lines spawn that are

~~if a bug is easily encountered and recreatable i would probably have fixed it by now~~
- lag happens every now and then and i dont know why
- if you dont reset the input manager sometimes theres no activepiece for some reason (and rotating throws an error) even though rotating is okay
- every now and then for no reason some number becomes nan and it looked ugly so when that happens i made the game crash (i think i fixed it but i dont know how to intentionally recreate the bug)
    - when softdrop is held the piece can jump up multiple blocks and never lock (something causes gravityelapsed to become nan)
    - probably related to gravityelapsed as well but the screen moves down a lot
- i dont know how the weird garbage variants would interact with the systems i put in place for normal garbage, like counting of lines of garbage and dig and whatnot
- why sometimes the renderer doesnt get a valid gamemanager object (and throws an error and the game is unplayable but refreshing fixes it)
- sometimes lines hang around for one frame even though the line clear are is supposed to be zero
- sometimes the dynamic text disappears prematurely and it might have something to do with focusing and unfocusing the window

the font is a modified version of bytesized by baltdev, i added a bunch of minos starting from \uEA00