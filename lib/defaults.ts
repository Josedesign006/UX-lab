import { uid } from "./db";
import { Study, StudyConfig, StudyType } from "./types";

export function defaultConfig(type: StudyType): StudyConfig {
  switch (type) {
    case "card-sort":
      return {
        kind: "card-sort",
        sortType: "open",
        cards: [
          { id: uid("c"), label: "Card 1" },
          { id: uid("c"), label: "Card 2" },
          { id: uid("c"), label: "Card 3" },
        ],
        categories: [],
        shuffleCards: true,
        requireAllCards: true,
      };
    case "tree-test":
      return {
        kind: "tree-test",
        tree: [
          {
            id: uid("n"),
            label: "Home",
            children: [
              { id: uid("n"), label: "Products", children: [] },
              { id: uid("n"), label: "About", children: [] },
            ],
          },
        ],
        tasks: [],
        shuffleTasks: false,
      };
    case "first-click":
      return { kind: "first-click", tasks: [] };
    case "survey":
      return { kind: "survey", questions: [] };
    case "prototype":
      return { kind: "prototype", screens: [], tasks: [] };
    case "usability":
      return {
        kind: "usability",
        tasks: [],
        askDifficulty: true,
        askComment: true,
      };
    case "cognitive-walkthrough":
      return {
        kind: "cognitive-walkthrough",
        persona:
          "A first-time user who has never used this product before. They are reasonably web-savvy but have no prior knowledge of where things are or what the labels mean.",
        questions: [
          {
            id: uid("q"),
            dimension: "goal",
            text: "Will the user try to achieve the right effect at this step?",
          },
          {
            id: uid("q"),
            dimension: "visibility",
            text: "Will the user notice that the correct action is available?",
          },
          {
            id: uid("q"),
            dimension: "match",
            text: "Will the user associate the correct action with the effect they want?",
          },
          {
            id: uid("q"),
            dimension: "feedback",
            text: "After the action, will the user see that progress is being made toward the goal?",
          },
        ],
        tasks: [
          {
            id: uid("t"),
            text: "Sign up for a new account",
            startContext:
              "The user lands on the marketing home page and wants to create an account.",
            steps: [
              { id: uid("st"), action: "Click the “Sign up” button in the top-right" },
              { id: uid("st"), action: "Enter an email address and password" },
              { id: uid("st"), action: "Click “Create account” to submit the form" },
            ],
          },
        ],
        askSeverity: true,
        askFailureStory: true,
      };
  }
}

export function newStudy(type: StudyType, name: string): Study {
  const now = new Date().toISOString();
  return {
    id: uid("s"),
    type,
    name,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    welcomeMessage:
      "Welcome, and thank you for taking part in this study! It only takes a few minutes — there are no right or wrong answers.",
    instructions: "",
    thankYouMessage: "All done — thank you for your time! You can now close this window.",
    preQuestions: [],
    postQuestions: [],
    config: defaultConfig(type),
  };
}
