
Sensei is a web-based application for teaching the user to learn some text materials. It is configured with a LLM model API for producing teaching material and a TTS API for speech synthesis. It supports:
1. Generate an interactive lesson from the text material (.md file or web link) provided by the user. The interactive lesson is composed of a few questions (True/False, Multiple Choice or short answer questions) interleaved with script for the teacher, the questions are meant to be hooks for the next section of teaching, or to be a quiz to test if the user understands previous materials.
2. The Questions are presented to the user with interactive elements on a Web page. When a answer for a question is submitted, the teacher AI agent delivers the next chunk of teaching material. The teaching materials are first converted into speech (via the TTS service), and played on the web page. The next question(s) are presented only after the current speech finishes playing.

The tutorial generation process is like this:
1. User submits some material, either a text (.md) file or a web link. If it is a web link, use a web client to get the text of the web page, extract the article text from it.
2. Save the text in a temporary directory. Check the length of the text, transform the text length into number of tokens (approximately). Compare the length to the configured context length (a configuration item in settings). If the text is longer than 80% of context length, we need to divide the text into chunks (not naively, use section dividers, paragraphs and sentences for chunking), after chunking, generate a brief summary for each chunk and save it locally, with identifiable file names.
3. Generate the tutorial for the material, with LLM API. If the text can fit into the context, put its whole in context, otherwise, we need to iteratively generate sections: put the previous chunks' summary + current chunk into the context. We need different prompts for generation for whole text and chunks - for chunks, the LLM needs to know which text are background information (summaries) and which text are for generating the tutorial.
4. The tutorial is composed of a series of nodes. A node can either be a script node (for teacher speech) or a question node (interactive question). 
   - The script node should have some sentences at the end notifying the user to answer the following question. 
   - A question node could be of different types (True/False, Multiple Choice, and short answer question), with a correct answer field. 
   - The first node must always be a script node (introductory), and the last node must be a script node (to wrap up the tutorial).
   - Use any format that is easy to parse to save the tutorial nodes.

When the tutorial is generated successfully, UI notify the user that he can 'play' the tutorial.
1. When the user clicks the play button, the tutorial nodes are played one by one.
2. For a script node, TTS API is called with the script text to generate the speech audio. The speech audio is played and cached to a file at the same time.
3. For a question node, the question is presented on the web page (with choices for T/F and multiple choice questions, and a text input for short answer questions). NOTE: the question is only presented when the previous script node audio finishes playing.
4. After the question node is presented, the system waits for the user submission (a click of submit button), then the system evaluate the user's answer by submitting question+correct answer+user answer+relevant script node (could be previous or next script node) to LLM API with an evaluation prompt, to generate a proper response: the response should state if the user is correct or not (be encouraging and polite), and briefly explain it,  and guide the user to  the next script node. This response it sent to TTS to convert to speech, played and cached.
5. After the evaluation audio finish playing, play the next script node.
6. The process is repeated until the whole tutorial is finished.

UI:
1. The main UI where material is submitted.
2. Tutorial playback interface where the generated tutorial is displayed and interacted with.
3. A settings panel for configuring tutorial playback options such as TTS API, LLM API, and chunking parameters.

Functionality:
1. Assume an OpenAI-compliant LLM API interface.
2. When the audio files are cached, serve the cached audio files, avoid calling TTS to generate audio for the same text.
3. The question node should have metadata for which script node(s) is the question relevant to, so that we can include relevant script text for answer evaluation.
4. Design mechanisms for remembering the current progress of a tutorial, so that user can pause/continue a tutorial, or revert to the beginning.