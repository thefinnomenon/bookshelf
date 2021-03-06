import { MockedProvider } from "@apollo/client/testing";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";

import { createAuthor, createBook } from "../../testUtils/factories";
import { BookCard } from "./BookCard";
import { UpdateBookFavouriteDocument } from "./UpdateBookFavourite.mutation.generated";

describe("<BookCard />", () => {
  const book = createBook({
    id: "1",
    author: createAuthor({ name: "Andrzej Sapkowski" })
  });

  it("displays author's name", () => {
    render(
      <MemoryRouter>
        <MockedProvider>
          <BookCard book={book} />
        </MockedProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Andrzej Sapkowski")).toBeInTheDocument();
  });

  it("handles add to favourites", async () => {
    // Given
    let mutationCalled = false;
    const mocks = [
      {
        request: {
          query: UpdateBookFavouriteDocument,
          variables: { id: "1", favourite: true }
        },
        result: () => {
          mutationCalled = true;
          return {};
        }
      }
    ];

    render(
      <MemoryRouter>
        <MockedProvider mocks={mocks}>
          <BookCard book={book} />
        </MockedProvider>
      </MemoryRouter>
    );

    // When
    fireEvent.click(screen.getByLabelText("Add to favourites"));

    // Then
    await waitFor(() => expect(mutationCalled).toBe(true));
  });
});
