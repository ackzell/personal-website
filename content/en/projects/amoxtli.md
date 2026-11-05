---
title: "Amoxtli Vue"
description: "An interactive and multimedia platform for learning Vue: text, video and hands-on components."
meaning: "book"
pronunciation: "ah-MOSH-tlee"
---

The spiritual successor to [Notes On Vue](https://notes-on-vue.ackzell.dev).
This is a project that has been in the back of my mind for the longest time. After gaining some experience in Vue I wanted to create a course on it, and that meant creating the materials and helper tools to support it. 

So I iterated first on the aforementioned Notes on Vue project. That one already had video, text and code snippets. But I really wanted to create a platform where interactivity was the main way to navigate it, and that also catered to different learning styles. 

So Amoxtli Vue  has a bunch of features that I've built for "the way I would like to learn Vue myself".

::media-video{src="https://youtu.be/kIEMJui34_4" title="Amoxtli Vue: a book of Vue you can run" wide}
::


An important aspect to highlight here is that the contents are **human-written**, and all the challenges, the quizzes and the lessons order is curated by hand. Meaning that even though we are using AI assistance to build the platform itself, the contents and the interaction that the students will have with it is aimed to be a connection between the author and the people reading the contents, if that makes sense.

## The features
Here's a quick gallery of the different features that the platform has. There's a few different components that will help you learn the concepts and internalize them as you use them. 

::media-palette{dir="/media/amoxtli" width="1440" height="900" label="Amoxtli's lessons"}
---
items:
  - id: live-code
    name: live code
    label: A v-on example edited in the lesson; typing a name and pressing "Call my name" logs a greeting in the console under the preview.
  - id: walkthrough
    name: walkthroughs
    label: A step-by-step walkthrough of reactive(), stepping through the code one change at a time beside the running example.
  - id: types
    name: types
    label: Hovering a typed event handler shows the types and docs for Event and HTMLInputElement, as an editor would.
  - id: annotations
    name: annotations
    label: A note pinned to a line of code, then collapsed lines expanded to show the rest of the component.
  - id: themes
    name: themes
    label: The lesson switched between light and dark, then the changelog opened from the version number.
  - id: languages
    name: languages
    label: The history lesson switched from English to Spanish (Mexico), keeping the reader on the same page.
---
::

No high quality learning platform is without quizzes and challenges, so we have those too. 

Challenges will check against a battery of tests that run in a specially created environment for the platform, and you will only pass the challenge when all of your tests have the green check mark.

::media-clip{src="/media/amoxtli/challenge.mp4" webm="/media/amoxtli/challenge.webm" poster="/media/amoxtli/challenge.webp" label="A challenge to build a color swatch picker; each swatch clicked fills the preview box with its color and name." width="1440" height="900"}
::

The quizzes are dynamic, meaning that they change the sorting of the questions **and the answers** are shuffled everytime you reload too.
::media-clip{src="/media/amoxtli/quiz.mp4" webm="/media/amoxtli/quiz.webm" poster="/media/amoxtli/quiz.webp" label="The Vue Basics checkpoint quiz answered and checked: each answer explained, and the quiz passed 100 of 100." width="1440" height="1300"}
::

Here's a preview of what I've written and completed thus far. It is a heavy WIP but that I am working toward completing to offer it to the public. Currently only accessible through a personal invite. I can hand you one if you are interested, just let me know 😉

::media-clip{src="/media/amoxtli/contents.mp4" webm="/media/amoxtli/contents.webm" poster="/media/amoxtli/contents.webp" label="The book's content tree opened from the lesson header; Interactivity, Reactivity and Styling expand, and the list scrolls down to the Styling challenge." width="1440" height="900"}
::
