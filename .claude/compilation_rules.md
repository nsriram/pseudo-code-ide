# Pseudo Code Rules

## INPUT
To input a value:
```
INPUT StudentName
```

## OUTPUT
To output a message or a value or a combination:

```
OUTPUT "You have made an error"
OUTPUT StudentName
OUTPUT "Student name is ", StudentName
```

## ASSIGNMENT
To assign a value to a variable (the value can be the result of a process or a calculation):

```
Counter <- 1
Counter <- Counter + 1
MyChar <- "A"
LetterValue <- ASC(MyChar)
StudentMark <- 40
Percentage <- (StudentMark / 80) * 100
Oldstring <- "Your mark is"
NewString <- OldString & " ninety-seven"
```

## CONDITIONALS (IF, THEN, ELSE)
To perform a selection using IF statements for a single choice or a choice and an alternative

### IF - single choice

```
IF – single choice
IF MyValue > YourValue
  THEN
    OUTPUT "I win"
ENDIF
```

### IF – single choice with alternative
```
IF MyValue > YourValue
  THEN
    OUTPUT "I win"
  ELSE
    OUTPUT "You win"
ENDIF
```

## CONDITIONALS (CASE)
CASE statements when there are multiple choices or multiple choices and an alternative:

### CASE – multiple choices
```
CASE OF Direction
  "N": Y <- Y + 1
  "S": Y <- Y – 1
  "E": X <- X + 1
  "W": X <- X – 1
ENDCASE
```

### CASE – multiple choices with alternative
```
CASE OF Direction
  "N": Y <- Y + 1
  "S": Y <- Y – 1←
  "E": X <- X + 1
  "W": X <- X – 1
  OTHERWISE : OUTPUT "Error"
ENDCASE
```

## RELATIONAL OPERATORS
Relational operators used in pseudocode selection statements:
```
=	Equal to
<>	Not equal to
>	Greater than
<	Less than
>=	Greater than or equal to
<=	Less than or equal to
```

## LOOPS (FOR NEXT STEP)
- A FOR loop has a fixed number of repeats, the STEP increment is an optional expression that must be a whole number
- To perform iteration using FOR loops:
    ```
    FOR Counter <- 1 TO 10 STEP 2
      OUTPUT Counter
    NEXT Counter
    ```
    or
    ```
    Total <- 0
    FOR Counter <- 1 TO 10
      OUTPUT "Enter a number "
      INPUT Number
      Total <- Total + Number
    NEXT Counter
    OUTPUT "The total is ", Total
    ```

## LOOPS (REPEAT UNTIL)
- Statements in a REPEAT loop are always executed at least once.
    ```
    REPEAT
      OUTPUT "Please enter a positive number "
      INPUT Number
    UNTIL Number > 0
    ```
  
## LOOPS (WHILE ENDWHILE)
- Statements in a WHILE loop may sometimes not be executed.
    ```
    Number <- 0
    WHILE Number >= 0 DO
      OUTPUT "Please enter a negative number "
      INPUT Number
    ENDWHILE
    ```

## DATATYPES

Below lists the basic data types
1. `BOOLEAN` : Boolean data type, logical values True and False
2. `CHAR`: Single alphanumeric character
3. `INTEGER` : Whole numbers, positive and negative
4. `REAL` : Positive or negative numbers with decimal points (floating-point numbers)
5. `STRING` : Sequence of alphanumeric characters
6. `DATE` : Value to represent a date

## DECLARATIONS
- In pseudocode and some programming languages, before data can be used, the type needs to be decided. 
- This is done by declaring the data type for each item to be used. 
- Each data item is identified by a unique name, called an identifier.

```
DECLARE <identifier> : <data type>
```

## CONSTANTS
- A constant is a data item that cannot be changed during the execution of a program.
```
CONSTANT pi <- 3.142
```

## RECORDS
- Records are composite data types formed by the inclusion of several related items 
that may be of different data types.
- In pseudocode, a record data type definition takes the following form:
    ```
    TYPE
    <Typename>
      DECLARE <identifier> : <data type>
      DECLARE <identifier> : <data type>
      DECLARE <identifier> : <data type>
      ::
      ::
    ENDTYPE
    ```

- For example, the book record data type could be defined like this:
    ```
    TYPE
    TbookRecord
      DECLARE title : STRING
      DECLARE author : STRING
      DECLARE publisher : STRING
      DECLARE noPages : INTEGER
      DECLARE fiction : BOOLEAN
    ENDTYPE
    ```

- The data type, `TbookRecord`, is now available for use and an identifier may now 
be declared in the usual way: `DECLARE Book : TbookRecord`

- Items from the record are now available for use and are identified by: `<identifier>.<item identifier>`
For example:

    ```
    Book.author <- "David Watson"
    Book.fiction <- FALSE
    ```
  
## ARRAYS
- An array is a data structure containing several elements of the same data type;
these elements can be accessed using the same identifier name.

### 1D Arrays
- When a 1D array is declared in pseudocode, the lower bound (LB), upper bound
  (UB) and data type are included:
    ```
    DECLARE <identifier> : ARRAY[LB:UB] OF <data type>
    ```
- For example: `DECLARE myList : ARRAY[0:8] OF INTEGER`
- The declared array can then be used, as follows: `myList[7] <- 16`

### 2D Arrays
- A 2D array can be referred to as a table, with rows and columns.
    ```
    DECLARE <identifier> : ARRAY[LBR:UBR, LBC:UBC] OF <data type>
    ```
- For example: `DECLARE myArray : ARRAY[0:8,0:2] OF INTEGER`
- The declared array can then be used, as follows: `myArray[7,0] <- 16`


## FILE OPEN
To open a file before reading from it or writing to it:
```
OPEN <file identifier> FOR <file mode>
```

### FILE OPEN MODES 
Files can be opened in one of the following modes:
1. `READ` reads data from the file
2. `WRITE` writes data to the file, any existing data stored in the file will be overwritten
3. `APPEND` adds data to the end of the file

## FILE READ
- Once the file is opened in READ mode, it can be read from a line at a time
- the variable must be of data type STRING.
```
READFILE <file identifier>, <variable>
```

## FILE WRITE 
- Once the file is opened in WRITE or APPEND mode, it can be written to a line at a time
- the variable must be of data type STRING.
```
WRITEFILE <file identifier>, <variable>
```

## TEST End Of File
- The function `EOF` is used to test for the end of a file. 
- It returns a value `TRUE` if the end of a file has been reached and `FALSE` otherwise.
```
EOF(<file identifier>)
```

## FILE CLOSE
When a file is no longer being used it should be closed:
```
CLOSEFILE <file identifier>
```

## PROCEDURES
- When writing an algorithm, there are often similar tasks to perform that make use of the same groups of statements. 
- Instead of repeating these statements every time they are required, many programming languages make use of
subroutines or named procedures. 

### PROCEDURE DEFINITION
- A procedure is defined once and can be called many times within a program.
    ```
    PROCEDURE <identifier>
      <statements>
    ENDPROCEDURE
    ```

### PROCEDURE INVOCATION
- The procedure can then be called many times:
    ```
    CALL <identifier>
    ```

## FUNCTIONS
- When writing an algorithm, there are often similar calculations or tasks to perform that make use of 
the same groups of statements and always produce an answer. 
- Instead of repeating these statements every time they are required, many programming languages 
make use of subroutines or named functions.


### FUNCTION DEFINITION WITHOUT PARAMETERS
- A function without parameters is defined in pseudocode as follows:
    ```
    FUNCTION <identifier> RETURNS <data type>
      <statements>
    ENDFUNCTION
    ```

### FUNCTION DEFINITION WITH PARAMETERS AND RETURN VALUE
- A function with parameters is defined in pseudocode as follows:
- The keyword RETURN is used as one of the statements in a function to specify the value to be returned.
    ```
    FUNCTION <identifier>(<parameter1>:<datatype>, <parameter2>:<datatype>...)
      RETURNS <datatype>
        <statements>
    ENDFUNCTION
    ```

## STRING MANIPULATION FUNCTIONS

- `LENGTH(anyString : STRING) : RETURNS INTEGER` returns the integer value representing the length of anyString.
- `RIGHT(anyString: STRING, x : INTEGER) RETURNS STRING` returns rightmost x characters from anyString.
- `LEFT(anyString: STRING, x : INTEGER) RETURNS STRING` returns leftmost x characters from anyString.
- `MID(anyString: STRING, x : INTEGER, y : INTEGER) RETURNS STRING` returns y characters starting at position x from anyString.









