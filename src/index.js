import dotenv from "dotenv";
import connectDB from "./db.js";
import { createTodo, deleteTodo, getTodos, updateTodo } from "./queries.js";
import { ai } from "./model.js";
import { prompt } from "./prompt.js";
import chalk from "chalk";
import readlineSync from "readline-sync";


const extractJson = (text) => {
  const jsonString = text.match(/```json\n([\s\S]*?)\n```/)[1];
  return JSON.parse(jsonString);
}

dotenv.config();

await connectDB()
  .then(() => console.log(chalk.green("✅ Connected to Database")))
  .catch((err) => {
    console.error(chalk.red("❌ Error connecting to Database"), err);
    process.exit(1);
  });


const mapQueries = {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
};

const messages = [
  {
    role: "user",
    parts: [{ text: prompt }],
  },
];

console.log(
  chalk.blueBright(`
╔═══════════════════════════════════════════════════════╗
║                                                                                                     ║
║     📝  ${chalk.bold("W E L C O M E   T O   T O D O !")}             ║
║                                                                                                     ║
║   ✨ Your personal task assistant, CLI-style ✨                       ║
║                                                                                                     ║
║   ➕ Add Tasks     ✅ Complete Tasks                                    ║
║   📋 View List     🗑️  Remove Tasks                                          ║
║                                                                                                     ║
║   Type a command or ask me anything!                                     ║
║                                                                                                     ║
╚═══════════════════════════════════════════════════════╝
`)
);

while (true) {
  const query = readlineSync.question(chalk.yellow(">> "));

  if (query.trim().toLowerCase() === "exit") {
    console.log(chalk.greenBright("👋 Goodbye!"));
    break;
  }

  const userInput = {
    type: "user",
    user: query
  }

  messages.push({
    role: "user",
    parts: [{ text: JSON.stringify(userInput) }],
  });

  while (true) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: messages,
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text;
      const responseJson = extractJson(responseText);

      console.log(responseText);

      messages.push({
        role: "assistant",
        parts: [{ text: responseText }],
      });

      if (responseJson.type === "action") {
        const action = responseJson.action;
        const queryFunction = mapQueries[action.type];

        if (!queryFunction) {
          console.log(chalk.red("❗ Unknown action requested by AI."));
          break;
        }

        let result;


        switch (action.type) {
          case "getTodos":
            result = await queryFunction();
            console.log(chalk.blueBright("📋 Todos:\n"), result);
            messages.push({
              role: "user",
              parts: [{ text: `Todos: ${JSON.stringify(result)}` }],
            });
            break;

          case "createTodo":
            result = await queryFunction(action.title);
            console.log(chalk.greenBright(`✅ Created Todo: ${result.title}`));
            messages.push({
              role: "user",
              parts: [{ text: `Todo created: ${result.title}` }],
            });
            break;

          case "updateTodo":
            result = await queryFunction(action.title, action.updates);
            console.log(chalk.greenBright(`🔄 Updated Todo: ${result.title}`));
            messages.push({
              role: "user",
              parts: [{ text: `Todo updated: ${result.title}` }],
            });
            break;

          case "deleteTodo":
            result = await queryFunction(action.title);
            console.log(chalk.redBright(`🗑️ Deleted Todo: ${result.title}`));
            messages.push({
              role: "user",
              parts: [{ text: `Todo deleted: ${result.title}` }],
            });
            break;
        }

        break; 
        
      } else if (responseJson.type === "output") {
        console.log(chalk.cyan(responseJson.output));
        break;
      } else {
        console.log(responseJson);
        console.log(chalk.red("❗ Unexpected response from AI."));
        break;
      }

    } catch (err) {
      console.error(chalk.red("❌ Error interacting with AI:"), err.message);
      break;
    }
  }
}
