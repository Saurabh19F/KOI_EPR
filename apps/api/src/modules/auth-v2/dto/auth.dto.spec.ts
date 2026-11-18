import { validate } from "class-validator";
import { ResetPasswordDto } from "./auth.dto";

describe("ResetPasswordDto", () => {
  function makeDto(newPassword: string) {
    return Object.assign(new ResetPasswordDto(), {
      token: "reset-token",
      newPassword,
    });
  }

  it("accepts a strong string password at the eight-character minimum", async () => {
    expect(await validate(makeDto("Abcdef1!"))).toEqual([]);
  });

  it("rejects a shorter password even when all character categories are present", async () => {
    const errors = await validate(makeDto("Abcd1!"));
    expect(errors[0].constraints).toHaveProperty("minLength");
  });

  it.each(["abcdefgh1!", "ABCDEFGH1!", "Abcdefgh!!", "Abcdefgh12"])(
    "rejects a password missing a required character category: %s",
    async (password) => {
      const errors = await validate(makeDto(password));
      expect(errors[0].constraints).toHaveProperty("matches");
    },
  );
});
