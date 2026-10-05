halfway done
- level select
    - make level select more beautiful
- glue block garbage (by cabbage)
- half pc
    - colour clear
- sound effects

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

things to add
- xspin ospin
    - i forgot whether i have a function to check for spin on arbitrary piece probably not i dont want to check right now

- compact rendering mode with smaller queue and smaller levels (maybe it says line clears above the score)

- hide the mouse when were playing the game

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

- play against bot
    - multiplayer peer to peer (scary)

- clicking on the screen lets you highlight like in chess
    - clicking on the screen also lets you draw tiles onto the board and you can swap between this and other stuff

- chess

- rigidbody physics