i dont actually have a name for this project right now
im currently calling it sorkurzdil which means entertaining thing related to many right angled figures
musi leko mute


known bugs
- lag happens every now and then and i dont know why
- if you dont reset the input manager sometimes theres no activepiece for some reason (and rotating throws an error) even though rotating is okay
- every now and then for no reason some number becomes nan and it looked ugly so when that happens i made the game crash
- i dont know how the weird garbage variants would interact with the systems i put in place for normal garbage, like counting of lines of garbage and dig and whatnot
- why sometimes the renderer doesnt get a valid gamemanager object
- sometimes lines hang around for one frame even though the line clear are is supposed to be zero

halfway done
- level select
    - make level select more beautiful
- glue block garbage (by cabbage)
- half pc
    - colour clear

things to add
- choose a font

- hide the mouse when were playing the game

- what if dithering
    - making the game render in a pixel way could be cool but its also going to be very hard to write and potentially expensive to draw

- input buffering and initial actions
    - because the previous one was bad

- use css animations for the countdown timer and text alerts instead of drawing to canvas (this one is done)
    - is it possible to do this for line clears as well it will probably boost performance
    - do i need to find out how to arbitrarily create elements and destroy them after a while (this one is maybe done idk its not modular right now)
    - upgrade the particle manager to use html elements instead of drawing to canvas
    - potentially get everything drawn using html instead of canvas???

- pps gauge

- finesse
    - perfect finesse vs great finesse
    - great finesse is key presses and perfect finesse is horizontal movement
        - i think it might be very easy to check for horizontal movement finesse
        - its also not dependent on board size because its just check how far you are away from the walls and check how far you are away from spawn location
        - hmmm the symmetric pieces make it way harder

- that line when you do 40l
    - line for 4l pc as well
        - make the 4l pc constraint harder like you need to stay under the line
            - lockout zone
                - what if there was a random disconnected lockout zone in the middle of the board

- puyo puyo garbage that falls from the sky ?

- a way to change settings
    - custom games

- drought indicator
    - indication for camera change with eye particle
    - talentless indicator

- tetrio attacking
    - techmino attacking
    - my own scoring system
    - my own attacking system
        - what if. exponentiator

- my own kicktable with chirality support

- conways game of tennis
    - gameconfigs for events after placing and after clearing in general
    - maybe events for before and after placing a piece

- are there more kinds of weird garbage generation

- what if we had symbols for indicating line clears and b2b, similar to what other tennises did for drought
    - maybe we can use binary for numbers but that might be pushing it
    - toki pona
        - kama for queue and awen for hold

- other bags like pentomino mode
    - techmino kicktable for pentominos
    - block blast bags

- play against bot
    - multiplayer peer to peer (scary)

- clicking on the screen lets you highlight like in chess
    - clicking on the screen also lets you draw tiles onto the board and you can swap between this and other stuff

- chess

- rigidbody physics