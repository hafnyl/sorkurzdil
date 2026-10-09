halfway done

- where are the image particles
    - indication for camera change with eye particle

- puyo puyo garbage that falls from the sky
    - the game picks pieces from a piece generator and drops them onto a board (and just retrying if it would clear a line because we dont want garbage to clear a line)

- glue block garbage (by cabbage)
    - glue block texture can it potentially extend out of the square
    - then i have to potentially care about z order
- other garbage models like bombs and metal (done but i didnt go look at what it looks like ingame)
    - maybe string to pixel art kind of thing (done)
    - oh yeah boolean operations between tile models and dithering stuff ~~instead of transparency (will it even look good)~~ use this for when pieces are white but hold isnt usable
        - colours should be able to be multiplied with each other btw (potentially used for the warning thing)
    - maybe connected tiles but its going to take so long to hardcode the many textures for each tile blehhh
        - is there potentially 256 cases
        - for tetrios connected textures they have like 24
        - its actually still a lot if i want to do it for like every tile
        - maybe its a feature for ugc stuff but i dont really want to type out alla that
        - images to pieces when
            - images to connected textures now its doable because image editing is way easier than typing string

- sound effects
    - i have to figure out how to play sounds from an atlas instead of like having a gigantic list of sound effects because this isnt game engine

- other bags like pentominos (done)
    - bags with the font or just the seven sul|fir (done)
    - 7 pentomino bag
    - techmino kicktable for pentominos (done)
    - block blast bags
    - potentially boiled pasta pieces lmao

- use css animations for the countdown timer and text alerts instead of drawing to canvas (this one is done)
    - is it possible to do this for line clears as well it will probably boost performance
    - do i need to find out how to arbitrarily create elements and destroy them after a while (this one is maybe done idk its not modular right now)
    - upgrade the particle manager to use html elements instead of drawing to canvas
    - potentially get everything drawn using html instead of canvas???

- level select
    - make level select more beautiful
    
things to add 2

- might store rows of the matrix in arrays of arrays as an optimisation for looking for rows (does this even save that much computation)
    - if i want to store columns as well its probably going to be hard to maintain

things to add
- multiple "active pieces" its probably more like instantiated pieces because they dont actually become the active piece until you place your active piece
    - this is only interesting with the rotating board thing

- xspin ospin
    - i forgot whether i have a function to check for spin on arbitrary piece probably not i dont want to check right now

- compact rendering mode with smaller queue and smaller levels (maybe it says line clears above the score)

- hide the mouse when were playing the game

- half pc
    - colour clear

- what if dithering
    - making the game render in a pixel way could be cool but its also going to be very hard to write and potentially expensive to draw

- input buffering and initial actions
    - because the previous one was bad

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

- a way to change settings
    - custom games

- various ugc stuff
    - custom pieces
    - custom tile textures
    - custom board starting layout

- drought indicator
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

- play against bot
    - multiplayer peer to peer (scary)

- clicking on the screen lets you highlight like in chess
    - clicking on the screen also lets you draw tiles onto the board and you can swap between this and other stuff

- chess

- rigidbody physics