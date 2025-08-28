import { OnePrepQuestion, BlueBookQuestion } from "@/types/question-types"

// Sample OnePrep question (MCQ)
export const sampleOnePrepMCQ: OnePrepQuestion = {
  question_id: 2606,
  answer_type: "mcq",
  stem_text: "Researchers and conservationists stress that biodiversity loss due to invasive species is ______. For example, people can take simple steps such as washing their footwear after travel to avoid introducing potentially invasive organisms into new environments.",
  stem_html: "<div><p>Researchers and conservationists stress that biodiversity loss due to invasive species is <span aria-hidden=\"true\">______</span><span class=\"sr-only\">blank</span>. For example, people can take simple steps such as washing their footwear after travel to avoid introducing potentially invasive organisms into new environments.</p></div>",
  explanation_text: "Choice A is the best answer because it most logically completes the text's discussion of how biodiversity loss due to invasive species can be avoided. As used in this context, \"preventable\" means able to be stopped or kept from happening. The text indicates that \"people can take simple steps\" to avoid bringing possible invasive species into new environments.",
  explanation_html: "<p>Choice A is the best answer because it most logically completes the text's discussion of how biodiversity loss due to invasive species can be avoided. As used in this context, \"preventable\" means able to be stopped or kept from happening. The text indicates that \"people can take simple steps\" to avoid bringing possible invasive species into new environments.</p>",
  choices: [
    {
      id: 9141,
      letter: "A",
      html: "<p>preventable</p>",
      text: "preventable",
      is_correct: true
    },
    {
      id: 9142,
      letter: "B", 
      html: "<p>undeniable</p>",
      text: "undeniable",
      is_correct: false
    },
    {
      id: 9143,
      letter: "C",
      html: "<p>common</p>",
      text: "common", 
      is_correct: false
    },
    {
      id: 9144,
      letter: "D",
      html: "<p>concerning</p>",
      text: "concerning",
      is_correct: false
    }
  ],
  spr_answers: [],
  meta: {
    is_marked_for_review: 0,
    answer_choices_status: {}
  }
}

// Sample OnePrep question (SPR)
export const sampleOnePrepSPR: OnePrepQuestion = {
  question_id: 2692,
  answer_type: "spr",
  stem_text: "A bag contains 100 tiles of equal area. According to the table, what is the probability of selecting a red tile?",
  stem_html: "<div><p>A bag contains 100 tiles of equal area. According to the table, what is the probability of selecting a red tile?</p></div>",
  explanation_text: "The correct answer is 3/10. It's given that there are a total of 100 tiles of equal area, which is the total number of possible outcomes. According to the table, there are a total of 30 red tiles. The probability of an event occurring is the ratio of the number of favorable outcomes to the total number of possible outcomes. By definition, the probability of selecting a red tile is given by 30/100, or 3/10. Note that 3/10 and .3 are examples of ways to enter a correct answer.",
  explanation_html: "<p>The correct answer is 3/10. It's given that there are a total of 100 tiles of equal area, which is the total number of possible outcomes. According to the table, there are a total of 30 red tiles. The probability of an event occurring is the ratio of the number of favorable outcomes to the total number of possible outcomes.</p>",
  choices: [],
  spr_answers: [".3", "3/10", "0.3"],
  meta: {
    is_marked_for_review: 1,
    answer_choices_status: {}
  }
}

// Sample BlueBook question (Choice)
export const sampleBlueBookChoice: BlueBookQuestion = {
  type: "choice",
  article: "<p>The National Heritage Fellowship was created to honor exceptional folk and traditional artists in the United States. One artist who received the fellowship is Navajo (Diné) basket weaver Mary Holiday Black. Black was chosen for her lifetime _________ the arts.</p>",
  question: "Which choice completes the text with the most logical and precise word or phrase?",
  options: [
    {
      name: "A",
      content: "contributions to"
    },
    {
      name: "B", 
      content: "doubts about"
    },
    {
      name: "C",
      content: "imitations of"
    },
    {
      name: "D",
      content: "misunderstandings of"
    }
  ],
  correct: "contributions to",
  solution: ""
}

// Sample BlueBook question (Write) with math
export const sampleBlueBookWrite: BlueBookQuestion = {
  type: "write",
  article: "<span style=\"font-size:20px;\"><span style=\"font-family:Times New Roman,Times,serif;\">Julia purchased 800 feet of fencing. She used 60% of this fencing to surround a vegetable garden. How many feet of fencing did Julia use to surround the vegetable garden?</span></span><br>",
  question: "",
  options: [],
  correct: "480",
  solution: "To find 60% of 800 feet: 0.60 × 800 = 480 feet"
}

// Sample BlueBook question with complex math
export const sampleBlueBookMath: BlueBookQuestion = {
  type: "choice", 
  article: "<span style=\"font-size:20px;\"><span style=\"font-family:Times New Roman,Times,serif;\">Which expression is equivalent to</span></span> <span class=\"mq-math-mode\" latex-data=\"13\\left(x^2-7\\right)\"><span class=\"mq-textarea\"><textarea autocapitalize=\"off\" autocomplete=\"off\" autocorrect=\"off\" spellcheck=\"false\" x-palm-disable-ste-all=\"true\" data-cke-editable=\"1\" contenteditable=\"false\"></textarea></span><span class=\"mq-root-block\" mathquill-block-id=\"1\"><span mathquill-command-id=\"3\">1</span><span mathquill-command-id=\"4\">3</span><span class=\"mq-non-leaf\" mathquill-command-id=\"5\"><span class=\"mq-scaled mq-paren\" style=\"transform: scale(1.08, 1.68);\">(</span><span class=\"mq-non-leaf\" mathquill-block-id=\"6\"><var mathquill-command-id=\"8\">x</var><span class=\"mq-supsub mq-non-leaf mq-sup-only\" mathquill-command-id=\"10\"><span class=\"mq-sup\" mathquill-block-id=\"11\"><span mathquill-command-id=\"13\">2</span></span></span><span mathquill-command-id=\"14\" class=\"mq-binary-operator\">−</span><span mathquill-command-id=\"15\">7</span></span><span class=\"mq-scaled mq-paren\" style=\"transform: scale(1.08, 1.68);\">)</span></span></span></span> ?<br>",
  question: "",
  options: [
    {
      name: "A",
      content: "<span class=\"mq-math-mode\" latex-data=\"13x^2-91\">13x² - 91</span>"
    },
    {
      name: "B",
      content: "<span class=\"mq-math-mode\" latex-data=\"13x^2-20\">13x² - 20</span>"
    },
    {
      name: "C", 
      content: "<span class=\"mq-math-mode\" latex-data=\"13x^2-7\">13x² - 7</span>"
    },
    {
      name: "D",
      content: "<span class=\"mq-math-mode\" latex-data=\"13x^2+6\">13x² + 6</span>"
    }
  ],
  correct: "<span class=\"mq-math-mode\" latex-data=\"13x^2-91\">13x² - 91</span>",
  solution: "Distribute 13 to both terms: 13(x² - 7) = 13x² - 91"
}
