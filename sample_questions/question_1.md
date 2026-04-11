# Problem Context
A teacher is designing a program to process pseudocode projects written by her students.
Each student project is stored in a text file. The process is split into a number of stages.
Each stage performs a different task and creates a new file.

For Example:

1. `MichaelAday_src.txt` : Student project file produced by Student Michael Aday
2. `MichaelAday_S1.txt` : File produced by Stage 1
3. `MichaelAday_S2.txt` : File produced by Stage 2

## Question 1
The teacher has defined the first program module as follows:

### DeleteSpaces Module
- **Module** : `DeleteSpaces()` 
- **Description** :
  - Called with a parameter of type string representing a line of pseudocode from a student's project file. 
  - Returns the line after removing any leading space characters.
  - The following example shows a string before and after the leading spaces have been removed:
    - Before: `" IF X2 > 13 THEN`
    - After: `"IF X2 > 13 THEN"`

### Ask
Complete the pseudocode for module DeleteSpaces().
`FUNCTION DeleteSpaces(Line : STRING) RETURNS STRING`

## Question 2
Two modules are defined as follows:

### DeleteComment Module
- **Module** : `DeleteComment()` _(already written)_
- **Description** :
    - called with a parameter of type string representing a line of pseudocode from a student’s project file 
    - returns the line after removing any comment

### Stage_2 Module
- **Module** : `Stage_2()`
- **Description** : 
  - called with two parameters:
    - a string representing an input file name
    - a string representing an output file name 
  - copies each line from the input file to the existing output file having first removed all leading spaces and comments from that line 
  - does not write blank lines to the output file 
  - outputs a final message giving the number of blank lines removed

### Ask
  - Write pseudocode for module Stage_2(). 
  - Modules `DeleteComment()` and `DeleteSpaces()` must be used in your solution.

