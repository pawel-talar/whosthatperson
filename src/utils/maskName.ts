const letterRegex = /[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/;

export const maskName = (name: string) =>
  Array.from(name)
    .map((char) => {
      if (letterRegex.test(char)) {
        return "_";
      }
      if (char === " ") {
        return " ";
      }
      return char;
    })
    .join(" ");
