# Problem Context
A class of students are developing a program to send data between computers. 
Many computers are connected together to form a wired network. 
Serial ports are used to connect one computer to another.

Each computer:
- is assigned a unique three-digit ID
- has three ports, each identified by an integer value
- is connected to between one and three other computers.

- Data is sent as individual message strings.
Each string contains the destination ID (the ID of the computer that is to receive the message) followed by the data:
    ```
    <DestinationID><Data>
    ```

- Messages may pass through several computers on the way to their destination. When a message arrives at a computer, 
that is not the destination, the program needs to forward it on to another computer using one of its serial ports.

- The port to use is obtained from information that is stored in an array `RouteTable`.
- `RouteTable` is a global 2D array of integers. It is declared in pseudocode as follows:
    ```
    DECLARE RouteTable : ARRAY[1: 6,1:3] OF INTEGER
    ```

- The values in the first two columns of `RouteTable` define a range of ID values.
- Column 3 gives the corresponding port number to use when forwarding the message to a computer with an ID within this range.

- For example, the contents of RouteTable could be:

    |       | Column 1 | Column 2      | Column 3      |
    |-------|----------|---------------|---------------|
    | Row 1 | 100      | 199           | 1             |
    | Row 2 | 200      | 259           | 2             |
    | Row 3 | -1       | `<undefined>` | `<undefined>` |
    | Row 4 | 260      | 399           | 2             |
    | Row 5 | 400      | 599           | 3             |
    | Row 6 | 600      | 999           | 1             |

- In this example, a message that arrives with a `DestinationID` of "283" will be forwarded using port 2.

- Row 3 in the example shows an unused row. These may occur anywhere. Unused rows have the column 1 element set to -1. 
The value of unused elements in the other two columns is `<undefined>`


## Question 1
The programmer has defined the first program module as follows:

### Module : GetPort() 
- **Module** : `GetPort()`
- **Description**:
  - Takes a DestinationID as a parameter of type string
  - Searches for the range corresponding to the DestinationID in the array 
  - Returns the port number, or returns - 1 if no corresponding range is

### Ask
- Write pseudocode for module `GetPort()` .
- Assume `DestinationID` contains a valid three-digit string.
