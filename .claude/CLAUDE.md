# CLAUDE.md

## Claude Configuration
- Use only the project level .claude folder for all 'claude code' related configuration and files.
- Do not use the global .claude folder.

## Project Overview
Cambridge AS level computer science pseudocode compiler for students to practice for Computer Science exams.
This project is designed to take pseudocode written in a specific format and compile it into executable code.

## Application Design
- The application will be frontend only with a clean and simple interface. 
- It will allow users to input their pseudocode and see the compiled code in real-time.
- There will be no backend or server-side components.

## Software
- ReactJS

## Features
Key features include
1. Generating Question to write pseudocode for
2. Compiling the pseudocode written by student
3. Evaluating the pseudocode by compiling it and checking for errors

## User Interface Design
* Layout
  * There will be 2 sections, top, approximately 15% of the page and the rest as bottom
* Top Section will have the question and a description
  * An example of the problem could be 
    * _"Find the average of a number of integers input"_
  * Or a much detailed problem could be as the one below
    * _"Write an algorithm using pseudocode to calculate and output the volumeand surface area of a sphere for any radius that is input."_
  * More sample questions are available in `<PROJECT_ROOT>/sample_questions` folder. 
    * These have context and ask sections. 
    * The context provides the background and the ask section provides the specific question to be solved.
  * Top section will also have a 'New Question' button that generates a new question for the student to solve. 
* Bottom section will have 2 large areas
  1. pseudocode input 
  2. Compiled code output.
* Input Section
  * User inputs pseudocode in a large text area.
  * Below the text area, there will be a "Compile" button that triggers the compilation process.
  * Do not provide any autocompletion or suggestions to the user. The application should only compile the pseudocode as it is written.
* Compilation Process :
  * Pseudocode is compiled on the frontend using a custom parser and compiler.
  * Compilation rules are defined in the `<PROJECT_ROOT>.claude/compilation_rules.md` file.
    * This contents of this file has the syntax in a self-explanatory manner 
    * These rules will specify how different pseudocode constructs should be translated into executable code.
* Compilation Output:
  * The compiled code is displayed in a separate area on the interface
  * The errors in the student submission should be highlighted in the compiled code output.

## Issue Tracking
- Beads will be used for issue tracking.
- Beads is a Dependency-Aware Issue Tracker.
- Beads can be accessed from the terminal using the `bd` command.
- `bd quickstart` can get you started.
- Beads is integrated with Claude Code via `bd setup claude --project`
- `bd status` provides status od the 

## Development Workflow
### Exploration
1. Analyze the application objective
2. Ask questions to clarify the requirements and constraints. 
   - This could be in a loop and is an exploratory activity as below
   - Understand the complexity of questions that you have to generate. Provide a few samples to validate
   - Clarify your understanding of the rules defined in the `<PROJECT_ROOT>.claude/compilation_rules.md` file.
   - Based on the response improve the `Features` and `User Interface Design` sections in the CLAUDE.md

### Analysis
1. Once the requirements are clear, analyze them and breakdown them into Epics and Stories (aka Issues).
2. A given Epic could have multiple stories (aka issues) and there could be interdependencies between the epics and stories.
3. A Story will have the following format:
   - Title: A concise title describing the story.
   - Description: A detailed description of the story, including the acceptance criteria and any relevant information.
   - Status: The current status of the story (e.g., blocked, unblocked, in progress, completed).
   - Acceptance Criteria: 
     - A list of conditions that must be met for the story to be considered complete. 
     - This could include specific functionality, performance requirements, or other criteria that are relevant to the story.
4. Add the epics and stories (aka issues) to the issue tracker (Beads) and start working on the implementation.
   - Assign the blocked and unblocked status to the issues based on the interdependencies between the epics.

### Implementation and Testing
1. List the available stories to develop and check with the user which one to start with.
2. Once the story is selected, ask for any clarifications if needed.
3. Prepare a plan with tasks for the implementation of the story and share it with the user for approval.
4. On implementation approval,
   - Assign the status of the stories (aka issues) to indicate the 
5. Implemented code should follow best practices defined in the `<PROJECT_ROOT>.claude/reactjs_best_practices.md` file. 
6. Unit tests for all code should be generated.
7. Once the implementation is complete, update or add the 'end to end UI test'
8. Before committing, run the CI checks locally:
   - `npm run lint` — must pass with zero errors
   - `npm test` — all unit tests must pass
9. Ensure git commits are done with clear messages and follow the git best practices
10. The pre-push git hook (installed via `sh scripts/setup-hooks.sh`) enforces step 8 automatically on every push.

## Memory
- The application will maintain a memory of the claude code interactions in `<PROJECT_ROOT>/.claude/MEMORY.md`.