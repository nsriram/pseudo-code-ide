import { writeFileSync } from 'fs'
import { resolve } from 'path'

interface Question {
  id: string
  difficulty: 'simple' | 'intermediate' | 'complex'
  title: string
  context: string
  ask: string
}

const questions: Question[] = [
  // ── Simple (20) ────────────────────────────────────────────────────────────
  {
    id: 'q001',
    difficulty: 'simple',
    title: 'Sum of Two Numbers',
    context: 'A student is writing a program to help younger pupils practise arithmetic.\nThe program should accept two whole numbers from the user and display their total.',
    ask: 'Write pseudocode to input two integers, calculate their sum, and output the result.',
  },
  {
    id: 'q002',
    difficulty: 'simple',
    title: 'Area of a Rectangle',
    context: 'A builder needs a simple tool to calculate floor area.\nThe program takes the length and width of a rectangular room and computes the area in square metres.',
    ask: 'Write pseudocode to input the length and width of a rectangle, calculate its area, and output the result.',
  },
  {
    id: 'q003',
    difficulty: 'simple',
    title: 'Celsius to Fahrenheit',
    context: 'A weather station records temperatures in Celsius.\nAn international visitor needs temperatures converted to Fahrenheit.\nThe conversion formula is: F = (C × 9 / 5) + 32',
    ask: 'Write pseudocode to input a temperature in Celsius and output the equivalent temperature in Fahrenheit using the formula above.',
  },
  {
    id: 'q004',
    difficulty: 'simple',
    title: 'Largest of Two Numbers',
    context: 'A game program needs to compare two players\'s scores at the end of a round.\nThe higher score determines the winner.',
    ask: 'Write pseudocode to input two numbers and output the larger of the two. If both numbers are equal, output a message to say so.',
  },
  {
    id: 'q005',
    difficulty: 'simple',
    title: 'Perimeter of a Square',
    context: 'A fencing company needs to calculate how much fencing material is required to enclose a square plot of land.',
    ask: 'Write pseudocode to input the side length of a square, calculate its perimeter (4 × side), and output the result.',
  },
  {
    id: 'q006',
    difficulty: 'simple',
    title: 'Odd or Even',
    context: 'A maths teacher wants a quick program to check whether numbers entered by pupils are odd or even.\nThe program should accept a single integer and classify it.',
    ask: 'Write pseudocode to input an integer and output "Odd" if the number is odd, or "Even" if the number is even.',
  },
  {
    id: 'q007',
    difficulty: 'simple',
    title: 'Volume of a Cube',
    context: 'A packaging company needs to calculate the volume of cubic storage boxes.\nThe volume of a cube is calculated as side × side × side.',
    ask: 'Write pseudocode to input the side length of a cube, calculate its volume, and output the result.',
  },
  {
    id: 'q008',
    difficulty: 'simple',
    title: 'Pass or Fail',
    context: 'A teacher needs a program to decide whether a student has passed an examination.\nThe school pass mark is 50 out of 100.\nStudents scoring 50 or above pass; all others fail.',
    ask: 'Write pseudocode to input a student\'s mark and output "Pass" if the mark is 50 or above, or "Fail" otherwise.',
  },
  {
    id: 'q009',
    difficulty: 'simple',
    title: 'Simple Interest',
    context: 'A bank offers a savings account that earns simple interest.\nSimple interest is calculated using the formula:\n  SI = (P × R × T) / 100\nwhere P is the principal, R is the annual rate (%), and T is the time in years.',
    ask: 'Write pseudocode to input the principal amount, the annual interest rate, and the number of years. Calculate and output the simple interest earned.',
  },
  {
    id: 'q010',
    difficulty: 'simple',
    title: 'Swap Two Variables',
    context: 'A sorting algorithm requires a utility that can exchange the values stored in two variables.\nThe swap must use a temporary variable so that no data is lost.',
    ask: 'Write pseudocode to input two numbers into variables A and B, swap their values using a temporary variable, and output the new values of A and B.',
  },
  {
    id: 'q011',
    difficulty: 'simple',
    title: 'Sphere Volume and Surface Area',
    context: 'A physics simulation requires calculations for spherical objects.\nFor a sphere of radius r:\n  Volume        = (4 / 3) × π × r³\n  Surface Area  = 4 × π × r²\nUse the value 3.14159 for π.',
    ask: 'Write pseudocode to input a radius, then calculate and output both the volume and the surface area of the sphere.',
  },
  {
    id: 'q012',
    difficulty: 'simple',
    title: 'Leap Year Check',
    context: 'A calendar application needs to determine whether a given year is a leap year.\nA year is a leap year if:\n- It is divisible by 4, AND\n- It is not divisible by 100, UNLESS it is also divisible by 400.',
    ask: 'Write pseudocode to input a year and output "Leap year" or "Not a leap year" according to the rules above.',
  },
  {
    id: 'q013',
    difficulty: 'simple',
    title: 'Ticket Price Calculator',
    context: 'A cinema charges the following ticket prices:\n- Adults (age 18 and over): $12.00\n- Children (age under 18): $7.50\n- Senior citizens (age 65 and over): $6.00\nThe program inputs the customer\'s age and outputs the correct ticket price.',
    ask: 'Write pseudocode to input a customer\'s age and output the appropriate ticket price.',
  },
  {
    id: 'q014',
    difficulty: 'simple',
    title: 'Average of Three Marks',
    context: 'An examination board needs to calculate a student\'s average mark across three papers.\nAll marks are integers in the range 0 to 100.',
    ask: 'Write pseudocode to input three examination marks, calculate the average, and output the result to two decimal places.',
  },
  {
    id: 'q015',
    difficulty: 'simple',
    title: 'BMI Calculator',
    context: 'A health application calculates Body Mass Index (BMI).\nBMI is calculated using the formula:\n  BMI = weight (kg) / (height (m))²\n\nBMI categories:\n- Underweight: BMI < 18.5\n- Normal:      18.5 ≤ BMI < 25\n- Overweight:  25 ≤ BMI < 30\n- Obese:       BMI ≥ 30',
    ask: 'Write pseudocode to input a person\'s weight (kg) and height (m), calculate their BMI, and output both the BMI value and the corresponding category.',
  },
  {
    id: 'q016',
    difficulty: 'simple',
    title: 'Currency Converter',
    context: 'A travel application converts between US Dollars (USD) and British Pounds (GBP).\nThe current exchange rate is: 1 USD = 0.79 GBP.\nThe user specifies the amount in USD and the program outputs the equivalent in GBP.',
    ask: 'Write pseudocode to input an amount in USD and output the equivalent amount in GBP. The exchange rate is 1 USD = 0.79 GBP.',
  },
  {
    id: 'q017',
    difficulty: 'simple',
    title: 'Maximum of Three Numbers',
    context: 'A data logging system receives three sensor readings every minute.\nIt needs to record the highest reading from each set of three values.',
    ask: 'Write pseudocode to input three numbers and output the largest of the three.',
  },
  {
    id: 'q018',
    difficulty: 'simple',
    title: 'Miles to Kilometres',
    context: 'A mapping application needs to convert distances entered in miles into kilometres.\nThe conversion factor is: 1 mile = 1.60934 kilometres.',
    ask: 'Write pseudocode to input a distance in miles and output the equivalent distance in kilometres.',
  },
  {
    id: 'q019',
    difficulty: 'simple',
    title: 'Electricity Bill',
    context: 'An electricity supplier charges customers based on the number of units used:\n- First 100 units:          $0.10 per unit\n- Units 101 to 300:         $0.15 per unit\n- Units above 300:          $0.20 per unit\nA fixed standing charge of $5.00 is added to every bill.',
    ask: 'Write pseudocode to input the number of units used and output the total electricity bill.',
  },
  {
    id: 'q020',
    difficulty: 'simple',
    title: 'Quadratic Discriminant',
    context: 'A mathematics program evaluates the discriminant of a quadratic equation ax² + bx + c = 0.\nThe discriminant D = b² − 4ac determines the nature of the roots:\n- D > 0 : two distinct real roots\n- D = 0 : one repeated real root\n- D < 0 : no real roots',
    ask: 'Write pseudocode to input the coefficients a, b, and c of a quadratic equation, calculate the discriminant, and output the nature of the roots.',
  },

  // ── Intermediate (20) ──────────────────────────────────────────────────────
  {
    id: 'q021',
    difficulty: 'intermediate',
    title: 'Count Odd and Even',
    context: 'A procedure Count() is required that:\n1. Inputs a value (all values will be positive integers)\n2. Counts the number of odd values and the number of even values input\n3. Repeats steps 1–2 until the sentinel value 99 is entered\n4. Outputs both counts with suitable messages\n\nThe sentinel value 99 must not be included in either count.',
    ask: 'Write pseudocode for the procedure Count().',
  },
  {
    id: 'q022',
    difficulty: 'intermediate',
    title: 'Running Total with Sentinel',
    context: 'A warehouse uses a program to total incoming stock quantities.\nThe operator enters quantities one at a time.\nEntering -1 signals the end of input.\nThe program must output the total quantity and the number of entries made.',
    ask: 'Write pseudocode to repeatedly input a quantity until -1 is entered. Output the total of all valid quantities and the count of valid entries. The value -1 must not be included in either total.',
  },
  {
    id: 'q023',
    difficulty: 'intermediate',
    title: 'Grade Calculator',
    context: 'A school uses the following grade boundaries for its examinations:\n  Grade A : 70 and above\n  Grade B : 60 – 69\n  Grade C : 50 – 59\n  Grade D : 40 – 49\n  Grade U : below 40\n\nAll marks are integers in the range 0 to 100.',
    ask: 'Write pseudocode to input a student\'s mark and output the corresponding grade using a CASE statement. Include validation to reject marks outside the range 0–100.',
  },
  {
    id: 'q024',
    difficulty: 'intermediate',
    title: 'String Reversal',
    context: 'A cryptography program needs to reverse the characters in a string as part of a simple cipher.\n\nThe pseudocode built-in functions available are:\n  LENGTH(s)        returns the number of characters in string s\n  MID(s, i, n)     returns n characters from string s starting at position i',
    ask: 'Write pseudocode for a function Reverse(Word : STRING) RETURNS STRING that returns the characters of Word in reverse order. Use the LENGTH and MID functions.',
  },
  {
    id: 'q025',
    difficulty: 'intermediate',
    title: 'Array Maximum and Position',
    context: 'A data logging program stores 10 temperature readings taken at hourly intervals.\nThe readings are stored in a 1D integer array.\nThe program must find both the highest temperature and the hour at which it was recorded.\nArray positions 1 to 10 correspond to hours 1 to 10.',
    ask: 'Write pseudocode to:\n1. Declare a 1D array of 10 integers called Temperatures\n2. Input 10 values into the array\n3. Output the highest temperature and the hour (index) at which it occurs',
  },
  {
    id: 'q026',
    difficulty: 'intermediate',
    title: 'Fibonacci Sequence',
    context: 'The Fibonacci sequence is defined as follows:\n  Term 1 = 1\n  Term 2 = 1\n  Term n = Term(n−1) + Term(n−2)  for n > 2\n\nThe first eight terms are: 1, 1, 2, 3, 5, 8, 13, 21',
    ask: 'Write pseudocode to input a positive integer N and output the first N terms of the Fibonacci sequence, one term per line.',
  },
  {
    id: 'q027',
    difficulty: 'intermediate',
    title: 'Number Guessing Game',
    context: 'A simple guessing game program works as follows:\n- The secret number is 42\n- The player repeatedly enters a guess\n- After each guess the program outputs "Too high", "Too low", or "Correct!"\n- The game ends when the player guesses correctly\n- The total number of attempts is recorded',
    ask: 'Write pseudocode for the guessing game. Output the number of attempts taken once the player guesses correctly.',
  },
  {
    id: 'q028',
    difficulty: 'intermediate',
    title: 'Count Vowels in a String',
    context: 'A text analysis program needs to count the vowels in a word entered by the user.\nThe vowels are: a, e, i, o, u (both upper and lower case).\n\nBuilt-in functions:\n  LENGTH(s)      returns the number of characters in string s\n  MID(s, i, n)   returns n characters from string s starting at position i\n  LCASE(s)       returns string s converted to lower case',
    ask: 'Write pseudocode to input a word and output the number of vowels it contains. Your solution must handle both upper and lower case letters.',
  },
  {
    id: 'q029',
    difficulty: 'intermediate',
    title: 'Prime Number Check',
    context: 'A mathematics program needs to determine whether a number entered by the user is prime.\nA prime number is a whole number greater than 1 that has no factors other than 1 and itself.\nExamples of prime numbers: 2, 3, 5, 7, 11, 13.',
    ask: 'Write pseudocode for a function IsPrime(N : INTEGER) RETURNS BOOLEAN that returns TRUE if N is prime and FALSE otherwise. Then write a main program that inputs a number and outputs whether it is prime.',
  },
  {
    id: 'q030',
    difficulty: 'intermediate',
    title: 'Linear Search',
    context: 'A library system stores the ISBN numbers of borrowed books in a 1D array.\nThe array is declared as:\n  DECLARE Books : ARRAY[1:100] OF STRING\nThe variable BookCount stores the number of books currently in the array.\n\nThe system needs a function to search for a specific ISBN.',
    ask: 'Write pseudocode for a function FindBook(ISBN : STRING) RETURNS INTEGER that performs a linear search of the Books array and returns the position (index) of the matching entry, or -1 if the ISBN is not found.',
  },
  {
    id: 'q031',
    difficulty: 'intermediate',
    title: 'Validate Password',
    context: 'A security system requires users to create a password that meets the following rules:\n- Must be at least 8 characters long\n- Must contain at least one digit (0–9)\n- Must contain at least one letter (a–z or A–Z)\n\nBuilt-in functions:\n  LENGTH(s)       returns the number of characters in s\n  MID(s, i, n)    returns n characters from s starting at position i',
    ask: 'Write pseudocode for a function ValidPassword(Pwd : STRING) RETURNS BOOLEAN that returns TRUE if the password meets all three rules, and FALSE otherwise.',
  },
  {
    id: 'q032',
    difficulty: 'intermediate',
    title: 'Sales Report',
    context: 'A shop records daily sales figures for five days of the week.\nSales are stored in a 1D array:\n  DECLARE Sales : ARRAY[1:5] OF REAL\n\nThe program must calculate:\n- The total sales for the week\n- The average daily sales\n- The day with the highest sales (use day numbers 1–5)',
    ask: 'Write pseudocode to input 5 sales figures, store them in the array, then output the total, average, and the day number with the highest sales.',
  },
  {
    id: 'q033',
    difficulty: 'intermediate',
    title: 'Multiplication Table Generator',
    context: 'A primary school teacher wants a program that prints multiplication tables.\nFor a given number N, the program should output lines of the form:\n  N x 1 = N\n  N x 2 = 2N\n  ...\n  N x 12 = 12N',
    ask: 'Write pseudocode to input a positive integer N and output the complete multiplication table for N from 1 to 12.',
  },
  {
    id: 'q034',
    difficulty: 'intermediate',
    title: 'Decimal to Binary Conversion',
    context: 'A computer science revision tool converts positive integers to their binary representation.\nThe conversion algorithm repeatedly divides the number by 2 and records the remainders.\nThe binary representation is the remainders read in reverse order.\n\nFor example: 13 → remainders 1,0,1,1 → binary 1101',
    ask: 'Write pseudocode to input a positive integer and output its binary representation as a string. Build the result by concatenating remainder digits and reversing at the end.',
  },
  {
    id: 'q035',
    difficulty: 'intermediate',
    title: 'ATM Withdrawal',
    context: 'An ATM program processes cash withdrawal requests.\nRules:\n- The account balance is stored as a REAL variable\n- A withdrawal is allowed only if the requested amount is:\n  - A positive multiple of 10\n  - Less than or equal to the current balance\n  - Less than or equal to the daily limit of $500\n- A $2.00 transaction fee is deducted in addition to the withdrawal amount',
    ask: 'Write pseudocode for a procedure Withdraw(Amount : REAL) that validates the request according to all three rules and, if valid, deducts the amount plus the fee from the balance. Output a success or failure message.',
  },
  {
    id: 'q036',
    difficulty: 'intermediate',
    title: 'Word Count in a Sentence',
    context: 'A text editor needs to count the number of words in a sentence entered by the user.\nWords are separated by single spaces.\nThe sentence always starts and ends with a non-space character.\n\nBuilt-in functions:\n  LENGTH(s)       returns the number of characters in s\n  MID(s, i, n)    returns n characters from s starting at position i',
    ask: 'Write pseudocode to input a sentence and output the number of words it contains. You may assume there are no consecutive spaces.',
  },
  {
    id: 'q037',
    difficulty: 'intermediate',
    title: 'Highest Common Factor',
    context: 'A mathematics program computes the Highest Common Factor (HCF) of two positive integers using the Euclidean algorithm.\nThe algorithm is:\n  WHILE b ≠ 0\n    temp ← b\n    b ← a MOD b\n    a ← temp\n  HCF = a',
    ask: 'Write pseudocode for a function HCF(A : INTEGER, B : INTEGER) RETURNS INTEGER that returns the highest common factor of A and B using the Euclidean algorithm shown above.',
  },
  {
    id: 'q038',
    difficulty: 'intermediate',
    title: 'Stack Using an Array',
    context: 'A program simulates a stack data structure using a 1D array.\nThe stack is declared as:\n  DECLARE Stack : ARRAY[1:10] OF INTEGER\n  DECLARE Top : INTEGER    // points to the index of the top item; 0 means empty\n\nTwo operations are needed:\n  Push(Value) — adds Value to the top of the stack if not full\n  Pop()       — removes and returns the top value if not empty',
    ask: 'Write pseudocode for the procedures Push(Value : INTEGER) and Pop() RETURNS INTEGER. Each procedure must check for overflow and underflow respectively and output an error message if the operation cannot be performed.',
  },
  {
    id: 'q039',
    difficulty: 'intermediate',
    title: 'Register Mark Entry',
    context: 'A teacher enters examination marks for a class into a program.\n- The number of students is input first\n- Then one mark per student is entered (marks are integers 0–100)\n- The program stores marks in a 1D array\n- After all marks are entered, the program outputs:\n  - The class average\n  - The number of students who scored above the average',
    ask: 'Write pseudocode to implement the above system. Declare the array with a maximum size of 50.',
  },
  {
    id: 'q040',
    difficulty: 'intermediate',
    title: 'Caesar Cipher Encoder',
    context: 'A Caesar cipher shifts each letter in a message by a fixed number of positions in the alphabet.\nFor example, with shift 3: A→D, B→E, Z→C.\nOnly letters (A–Z, a–z) are shifted; all other characters remain unchanged.\nThe shift wraps around (Z shifted by 1 becomes A).\n\nBuilt-in functions:\n  LENGTH(s)       returns the number of characters in s\n  MID(s, i, n)    returns n characters from s at position i\n  ASC(c)          returns the ASCII code of character c\n  CHR(n)          returns the character with ASCII code n',
    ask: 'Write pseudocode for a function CaesarEncode(Message : STRING, Shift : INTEGER) RETURNS STRING that encodes the message using the Caesar cipher with the given shift value.',
  },

  // ── Complex (10) ───────────────────────────────────────────────────────────
  {
    id: 'q041',
    difficulty: 'complex',
    title: 'Delete Leading Spaces',
    context: 'A teacher is designing a program to process pseudocode projects written by students.\nEach student\'s project is stored in a text file and processed in stages.\n\nStage 1 requires a module called DeleteSpaces:\n- Called with a parameter of type STRING representing one line of pseudocode\n- Returns the line with all leading space characters removed\n\nExample:\n  Input:  "   IF X > 13 THEN"\n  Output: "IF X > 13 THEN"',
    ask: 'Complete the pseudocode for the module below.\nFUNCTION DeleteSpaces(Line : STRING) RETURNS STRING',
  },
  {
    id: 'q042',
    difficulty: 'complex',
    title: 'Stage 2 File Processing',
    context: 'A teacher\'s pseudocode project processor has two already-written modules:\n\nDeleteSpaces(Line : STRING) RETURNS STRING\n  — removes leading spaces from a line (written in a previous question)\n\nDeleteComment(Line : STRING) RETURNS STRING\n  — removes any comment from a line and returns the result\n\nA new module Stage_2 is now required:\n- Takes two STRING parameters: an input filename and an output filename\n- Reads each line from the input file\n- Removes leading spaces and comments using the two modules above\n- Writes non-blank lines to the output file\n- Outputs a message at the end stating how many blank lines were not written',
    ask: 'Write pseudocode for the module Stage_2(InputFile : STRING, OutputFile : STRING).\nYou must use DeleteSpaces() and DeleteComment() in your solution.',
  },
  {
    id: 'q043',
    difficulty: 'complex',
    title: 'Network Route Lookup',
    context: 'Computers in a network each have a unique three-digit ID.\nMessages are forwarded between computers using a global routing table:\n\n  DECLARE RouteTable : ARRAY[1:6, 1:3] OF INTEGER\n\n- Column 1: lower bound of an ID range\n- Column 2: upper bound of the ID range\n- Column 3: the port number to use when forwarding to that range\n- Unused rows have –1 in column 1\n\nExample RouteTable contents:\n  Row 1: 100, 199, 1\n  Row 2: 200, 259, 2\n  Row 3: –1,  —,   —\n  Row 4: 260, 399, 2\n  Row 5: 400, 599, 3\n  Row 6: 600, 999, 1\n\nA message with DestinationID "283" would use port 2 (row 4 matches 260–399).',
    ask: 'Write pseudocode for the function:\n  GetPort(DestinationID : STRING) RETURNS INTEGER\n\nThe function should:\n- Search RouteTable for the range that contains DestinationID\n- Return the corresponding port number\n- Return –1 if no matching range is found\n\nAssume DestinationID is always a valid three-digit string.',
  },
  {
    id: 'q044',
    difficulty: 'complex',
    title: 'Student Record System',
    context: 'A school needs a program to manage student examination records.\nEach student record holds:\n  - Name         STRING\n  - Three marks  INTEGER  (Maths, Science, English; each 0–100)\n  - Average      REAL     (calculated from the three marks)\n\nA TYPE declaration for TStudent should be used.\nThe class has at most 30 students.\nStudent data is stored in a text file "students.txt" with each student\'s data on four consecutive lines: name, then three marks.',
    ask: 'Write pseudocode to:\n1. Declare the TStudent record type\n2. Declare an array of 30 TStudent records called Class\n3. Write a procedure LoadStudents() that reads data from "students.txt" and fills the array, setting StudentCount to the number loaded\n4. Write a function AverageForStudent(S : TStudent) RETURNS REAL that returns the mean of the three marks',
  },
  {
    id: 'q045',
    difficulty: 'complex',
    title: 'Bubble Sort',
    context: 'A program needs to sort an array of examination marks into ascending order.\nThe array is declared as:\n  DECLARE Marks : ARRAY[1:N] OF INTEGER\n\nThe bubble sort algorithm works by making repeated passes through the array.\nOn each pass, adjacent elements that are in the wrong order are swapped.\nThe algorithm stops when a complete pass is made with no swaps.',
    ask: 'Write pseudocode for a procedure BubbleSort(BYREF Data : ARRAY[1:N] OF INTEGER, Size : INTEGER) that sorts the array in ascending order using bubble sort.\nUse a REPEAT…UNTIL loop that terminates when no swaps occur in a pass.',
  },
  {
    id: 'q046',
    difficulty: 'complex',
    title: 'Binary Search',
    context: 'A program stores a sorted list of product codes in a 1D array:\n  DECLARE Products : ARRAY[1:200] OF STRING\n  DECLARE ProductCount : INTEGER\n\nThe array is sorted in ascending alphabetical order.\nA binary search is more efficient than a linear search for large sorted arrays.\n\nBinary search algorithm:\n- Set Low = 1, High = ProductCount\n- Repeatedly calculate Mid = (Low + High) DIV 2\n- Compare the target with Products[Mid]\n- Narrow the search range until found or Low > High',
    ask: 'Write pseudocode for a function BinarySearch(Target : STRING) RETURNS INTEGER that searches the Products array and returns the index of Target, or –1 if not found.',
  },
  {
    id: 'q047',
    difficulty: 'complex',
    title: '2D Array: Seating Plan',
    context: 'A cinema uses a 2D array to represent its seating plan:\n  DECLARE Seats : ARRAY[1:10, 1:15] OF BOOLEAN\n  TRUE means the seat is booked; FALSE means it is available.\n  Rows are numbered 1–10, columns 1–15.\n\nThree operations are required:\n  BookSeat(Row, Col)   — marks a seat as booked if it is currently free\n  CancelSeat(Row, Col) — marks a seat as available if it is currently booked\n  CountAvailable()     — returns the total number of available seats',
    ask: 'Write pseudocode for all three procedures/functions described above.\nEach procedure must validate that the row and column are within bounds and output an appropriate error message if not.',
  },
  {
    id: 'q048',
    difficulty: 'complex',
    title: 'Recursive Factorial',
    context: 'A mathematics library requires a recursive implementation of the factorial function.\nThe factorial of a non-negative integer n is defined as:\n  0! = 1\n  n! = n × (n − 1)!   for n > 0\n\nFor example: 5! = 5 × 4 × 3 × 2 × 1 = 120\n\nThe function must handle the base case to avoid infinite recursion.',
    ask: 'Write pseudocode for a recursive function Factorial(N : INTEGER) RETURNS INTEGER.\nThen write a main program that inputs a non-negative integer and outputs its factorial.',
  },
  {
    id: 'q049',
    difficulty: 'complex',
    title: 'Queue Using an Array',
    context: 'A program simulates a queue (first-in, first-out) data structure using a circular array:\n  DECLARE Queue : ARRAY[1:8] OF INTEGER\n  DECLARE Front : INTEGER   // index of the front item\n  DECLARE Rear  : INTEGER   // index of the last item\n  DECLARE Size  : INTEGER   // current number of items\n\nInitially Front = 1, Rear = 0, Size = 0.\nThe queue uses positions 1–8 with wrap-around (after position 8 comes position 1).\n\nTwo operations are needed:\n  Enqueue(Value) — adds Value to the rear if not full (max 8 items)\n  Dequeue()      — removes and returns the front value if not empty',
    ask: 'Write pseudocode for both Enqueue(Value : INTEGER) and Dequeue() RETURNS INTEGER.\nEach must check for overflow/underflow and output an error message if the operation cannot be performed.',
  },
  {
    id: 'q050',
    difficulty: 'complex',
    title: 'Text File Word Frequency',
    context: 'A program analyses a text file to count how many times each unique word appears.\nThe file "document.txt" contains one word per line (all lowercase, no punctuation).\n\nTwo parallel arrays are used:\n  DECLARE Words  : ARRAY[1:100] OF STRING\n  DECLARE Counts : ARRAY[1:100] OF INTEGER\n  DECLARE UniqueCount : INTEGER   // number of distinct words found so far\n\nAlgorithm:\n- For each word read from the file:\n  - If the word already exists in Words[], increment the corresponding Counts[] entry\n  - Otherwise add it as a new entry with count 1\n- After processing, output each word and its count, sorted by count (highest first)',
    ask: 'Write pseudocode to:\n1. Read all words from "document.txt" and populate the two arrays\n2. Write a procedure SortByFrequency() that sorts both arrays together by count in descending order (use any sort algorithm)\n3. Output each unique word and its count after sorting',
  },
]

// ── Write output ─────────────────────────────────────────────────────────────

const outputPath = resolve(import.meta.dirname, '../src/features/questions/questions.json')
// eslint-disable-next-line security/detect-non-literal-fs-filename -- path is resolved from import.meta.dirname, not user input
writeFileSync(outputPath, JSON.stringify(questions, null, 2) + '\n')

const counts = questions.reduce<Record<string, number>>((acc, q) => {
  acc[q.difficulty] = (acc[q.difficulty] ?? 0) + 1
  return acc
}, {})

console.log(`✓ Written ${questions.length} questions to ${outputPath}`)
console.log(`  Simple: ${counts.simple}  Intermediate: ${counts.intermediate}  Complex: ${counts.complex}`)