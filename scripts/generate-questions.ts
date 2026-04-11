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
  // ── Simple (10) ────────────────────────────────────────────────────────────
  {
    id: 'q001',
    difficulty: 'simple',
    title: 'Sum of Two Numbers',
    context: 'A student needs a program to add two numbers together.',
    ask: 'Write pseudocode to input two integers, calculate their sum, and output the result.',
  },
  {
    id: 'q002',
    difficulty: 'simple',
    title: 'Area of a Rectangle',
    context: 'A program is needed to calculate the area of a rectangle.',
    ask: 'Write pseudocode to input the length and width of a rectangle, calculate its area, and output the result.',
  },
  {
    id: 'q003',
    difficulty: 'simple',
    title: 'Celsius to Fahrenheit',
    context: 'A weather application needs to convert temperatures.',
    ask: 'Write pseudocode to input a temperature in Celsius and output the equivalent temperature in Fahrenheit. Use the formula: F = (C × 9/5) + 32.',
  },
  {
    id: 'q004',
    difficulty: 'simple',
    title: 'Largest of Two Numbers',
    context: 'A program is needed to compare two numbers.',
    ask: 'Write pseudocode to input two numbers and output the larger of the two.',
  },
  {
    id: 'q005',
    difficulty: 'simple',
    title: 'Perimeter of a Square',
    context: 'A program is needed to calculate the perimeter of a square.',
    ask: 'Write pseudocode to input the side length of a square, calculate its perimeter, and output the result.',
  },
  {
    id: 'q006',
    difficulty: 'simple',
    title: 'Odd or Even',
    context: 'A program needs to determine whether a number is odd or even.',
    ask: 'Write pseudocode to input an integer and output whether it is "Odd" or "Even".',
  },
  {
    id: 'q007',
    difficulty: 'simple',
    title: 'Volume of a Cube',
    context: 'A program is needed to calculate the volume of a cube.',
    ask: 'Write pseudocode to input the side length of a cube, calculate its volume (side³), and output the result.',
  },
  {
    id: 'q008',
    difficulty: 'simple',
    title: 'Pass or Fail',
    context: 'A teacher needs a program to determine if a student has passed an exam. The pass mark is 50.',
    ask: 'Write pseudocode to input a student\'s mark and output "Pass" if the mark is 50 or above, or "Fail" otherwise.',
  },
  {
    id: 'q009',
    difficulty: 'simple',
    title: 'Simple Interest',
    context: 'A bank needs a program to calculate simple interest.',
    ask: 'Write pseudocode to input the principal amount, rate of interest, and time in years. Calculate and output the simple interest using the formula: SI = (P × R × T) / 100.',
  },
  {
    id: 'q010',
    difficulty: 'simple',
    title: 'Swap Two Variables',
    context: 'A program is needed to swap the values of two variables.',
    ask: 'Write pseudocode to input two numbers into variables A and B, swap their values using a temporary variable, and output the swapped values.',
  },

  // ── Intermediate (10) ──────────────────────────────────────────────────────
  {
    id: 'q011',
    difficulty: 'intermediate',
    title: 'Count Odd and Even',
    context: 'A procedure Count() will:\n1. Input a value (all values will be positive integers)\n2. Count the number of odd values and the number of even values\n3. Repeat from step 1 until the value input is 99\n4. Output the two count values with a suitable message.',
    ask: 'Write pseudocode for the procedure Count(). The value 99 must not be counted.',
  },
  {
    id: 'q012',
    difficulty: 'intermediate',
    title: 'Sum of N Numbers',
    context: 'A program is needed to calculate the sum of a series of numbers input by a user.',
    ask: 'Write pseudocode to input a positive integer N, then input N numbers, calculate their sum and average, and output both results.',
  },
  {
    id: 'q013',
    difficulty: 'intermediate',
    title: 'Multiplication Table',
    context: 'A student wants a program to display a multiplication table.',
    ask: 'Write pseudocode to input a number N and output the multiplication table for N from 1 to 12 (e.g. "N × 1 = N", "N × 2 = 2N", etc.).',
  },
  {
    id: 'q014',
    difficulty: 'intermediate',
    title: 'Largest of N Numbers',
    context: 'A program is needed to find the largest value from a set of inputs.',
    ask: 'Write pseudocode to input 10 integers and output the largest value entered.',
  },
  {
    id: 'q015',
    difficulty: 'intermediate',
    title: 'String Reversal',
    context: 'A program is needed to reverse the characters in a string.',
    ask: 'Write pseudocode to input a string and output the string in reverse order. Use the LENGTH and MID functions.',
  },
  {
    id: 'q016',
    difficulty: 'intermediate',
    title: 'Grade Calculator',
    context: 'A school uses the following grade boundaries:\n- A: 70 and above\n- B: 60–69\n- C: 50–59\n- D: 40–49\n- F: below 40',
    ask: 'Write pseudocode to input a student\'s percentage mark and output the corresponding grade using a CASE statement.',
  },
  {
    id: 'q017',
    difficulty: 'intermediate',
    title: 'Count Vowels',
    context: 'A program is needed to count the number of vowels in a word.',
    ask: 'Write pseudocode to input a word and output the number of vowels (a, e, i, o, u) it contains. Use the LENGTH and MID functions.',
  },
  {
    id: 'q018',
    difficulty: 'intermediate',
    title: 'Number Guessing Game',
    context: 'A simple number guessing game stores a secret number.',
    ask: 'Write pseudocode for a game where the secret number is 42. The program repeatedly inputs a guess and outputs "Too high", "Too low", or "Correct!" until the user guesses correctly. Count and output the number of attempts taken.',
  },
  {
    id: 'q019',
    difficulty: 'intermediate',
    title: 'Store and Find Maximum in Array',
    context: 'A program needs to store and process a list of exam scores.',
    ask: 'Write pseudocode to declare a 1D array of 10 integers, input 10 exam scores into the array, then output the highest score and the position (index) at which it occurs.',
  },
  {
    id: 'q020',
    difficulty: 'intermediate',
    title: 'Fibonacci Sequence',
    context: 'The Fibonacci sequence starts 1, 1, 2, 3, 5, 8… where each term is the sum of the previous two.',
    ask: 'Write pseudocode to input a positive integer N and output the first N terms of the Fibonacci sequence.',
  },

  // ── Complex (5) ────────────────────────────────────────────────────────────
  {
    id: 'q021',
    difficulty: 'complex',
    title: 'Delete Leading Spaces',
    context: 'A teacher is designing a program to process pseudocode projects written by her students. Each student project is stored in a text file.\n\nThe DeleteSpaces module:\n- Is called with a parameter of type STRING representing a line of pseudocode\n- Returns the line after removing any leading space characters\n\nExample:\n- Before: "   IF X2 > 13 THEN"\n- After:  "IF X2 > 13 THEN"',
    ask: 'Complete the pseudocode for module DeleteSpaces().\n`FUNCTION DeleteSpaces(Line : STRING) RETURNS STRING`',
  },
  {
    id: 'q022',
    difficulty: 'complex',
    title: 'Stage 2 File Processing',
    context: 'A teacher is designing a program to process pseudocode projects. Two modules are defined:\n\n**DeleteComment()** (already written):\n- Called with a STRING parameter representing a line of pseudocode\n- Returns the line after removing any comment\n\n**Stage_2()** to be written:\n- Called with two parameters: an input file name and an output file name (both STRING)\n- Copies each line from the input file to the output file after removing leading spaces and comments\n- Does not write blank lines to the output file\n- Outputs a final message giving the number of blank lines removed',
    ask: 'Write pseudocode for module Stage_2(). Modules DeleteComment() and DeleteSpaces() must be used in your solution.',
  },
  {
    id: 'q023',
    difficulty: 'complex',
    title: 'Network Route Lookup',
    context: 'Computers in a network each have a unique three-digit ID and are connected via serial ports.\n\nA global 2D array stores routing information:\n```\nDECLARE RouteTable : ARRAY[1:6, 1:3] OF INTEGER\n```\n- Column 1: lower bound of ID range\n- Column 2: upper bound of ID range\n- Column 3: port number to use\n- Unused rows have column 1 set to -1\n\nFor example, a message with DestinationID "283" would use port 2 if row [200–259→port 2] exists.',
    ask: 'Write pseudocode for module GetPort():\n- Takes DestinationID as a STRING parameter\n- Searches RouteTable for the matching ID range\n- Returns the port number, or -1 if no range matches\n\nAssume DestinationID contains a valid three-digit string.',
  },
  {
    id: 'q024',
    difficulty: 'complex',
    title: 'Student Record System',
    context: 'A school needs a program to manage student records. Each student has:\n- A name (STRING)\n- Three subject marks (INTEGER): Maths, Science, English\n- An average mark (REAL)\n\nA record type TStudent should be used.',
    ask: 'Write pseudocode to:\n1. Declare the TStudent record type\n2. Declare an array of 30 TStudent records\n3. Write a procedure LoadStudents() that reads student data from a file "students.txt" into the array (name and three marks per student, one value per line)\n4. Write a function AverageForStudent(s : TStudent) RETURNS REAL that calculates and returns the average of the three marks',
  },
  {
    id: 'q025',
    difficulty: 'complex',
    title: 'Bubble Sort',
    context: 'A program needs to sort an array of integers into ascending order using the bubble sort algorithm.\n\nBubble sort works by repeatedly stepping through the array, comparing adjacent elements and swapping them if they are in the wrong order. The pass is repeated until no swaps occur.',
    ask: 'Write pseudocode for a procedure BubbleSort() that:\n- Takes a 1D array of integers (declared as ARRAY[1:N] OF INTEGER) and its size N as parameters\n- Sorts the array in ascending order in-place using bubble sort\n- Uses a REPEAT loop that stops when a complete pass makes no swaps',
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