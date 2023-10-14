import styled from "styled-components";

export const Button = styled.button`
  background-color: #6b5dfb;
  color: white;
  display: block;

  text-align: center;
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
    border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

  font-weight: 400;

  font-size: 1.25rem;
  line-height: 1.5;
  border-radius: 0.3rem;
  border: 1px solid transparent;
  padding: 0.5rem 1rem;
  width: 100%;
  margin-bottom: 1rem;

  &:hover {
    text-decoration: none;
    background-color: #4f3efd;
    color: white;
  }
  &:focus {
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }

  &:disabled {
    opacity: 0.65;
  }
`;
