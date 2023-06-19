import { get_encoding, Tiktoken } from "tiktoken";
import Tokenizer from "sentence-tokenizer";

const { ceil } = Math;
const string:string = "Hello, this is an entry.. I hate noodles very much. ";
const enc:Tiktoken = get_encoding("cl100k_base");
const Tokenize = new Tokenizer();

function getSentences(string:string):string[] {
  Tokenize.setEntry(string);
  return Tokenize.getSentences();
}

function splitPrompt(prompt:string, MAX_TOKENS:number):string[] {
  if (MAX_TOKENS < 16) throw new Error("MAX_TOKENS parameter cannot be less than 16.");
  
  let tokens:Uint32Array = enc.encode(prompt);
  if (tokens.length <= MAX_TOKENS) return [prompt];

  let finished:number = 0;
  let prompts:string[] = [], currentPrompt:string;
  let length:number = 0;
  let sentences:number[] = getSentences(prompt).map((e) => {
    return length += (e.length + 1);
  });

  function splitSentence(string:string):number[] {
    let splitChar:string = " ";
    let words:string[] = string.split(" ");
    let midpoint:number = ceil(words.length / 2);

    if (words.length === 1) {
      words = string.split(splitChar = "");
    }

    let pt1:number = words.slice(0, midpoint).join(splitChar).length;
    let pt2:number = words.slice(midpoint).join(splitChar).length;
    
    return [ pt1 + pt2, pt1 ];
  }
  
  while (tokens.length > MAX_TOKENS) {
    let splitEstimate:number = length * (MAX_TOKENS / tokens.length);
    let pushed:number|boolean = false;
    for (let i = 1; i < sentences.length + 1; i++) {
      currentPrompt = prompt.slice(finished, sentences[i - 1]);
    
      if (currentPrompt.length >= splitEstimate) {
        tokens = enc.encode(currentPrompt);
        for (let iI = 1; tokens.length > MAX_TOKENS; iI++) {
          currentPrompt = prompt.slice(finished, sentences[i - iI]);
          tokens = enc.encode(currentPrompt);

          if (tokens.length > MAX_TOKENS) {
            if (i - iI === 0) {
              sentences = [...splitSentence(prompt.slice(finished, sentences[i = 0])), ...sentences.slice(pushed = 1)];
              break;
            }
            continue;
          }

          pushed = true;
          prompts.push(currentPrompt);
          tokens = enc.encode(prompt.slice(finished = sentences[i - iI]));
          sentences = sentences.slice(i - iI + 1);
          i = 0;
          break;
        }

        if (!pushed) {
          tokens = enc.encode(prompt.slice(finished = sentences[i - 1]));
          prompts.push(currentPrompt);
          sentences.splice(i);  
          i = 0;
        }
      }
    }

    if (sentences.length) {
      prompts.push(prompt.slice(finished));
      tokens = new Uint32Array();
    }
  }

  return enc.free(), prompts;
};

// console.log(splitPrompt(string.repeat(10), 45));