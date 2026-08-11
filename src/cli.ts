import inquirer from "inquirer";

export async function askUser(): Promise<string> {
  const answer = await inquirer.prompt([
    {
      type: "input",
      name: "message",
      message: "You :",
    },
  ]);
  return answer.message;
}
