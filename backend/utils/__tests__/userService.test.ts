import {
  parseRoles,
  RaitaUser,
  validateAdminUser,
  validateExtendedUser,
  validateReadUser,
} from '../userService';

describe('userService role checks', () => {
  test('success: read user', () => {
    const readUser: RaitaUser = {
      uid: 'read',
      roles: ['Raita_luku'],
    };
    expect(validateReadUser(readUser)).resolves.not.toThrow();
    expect(validateExtendedUser(readUser)).rejects.toBeTruthy();
    expect(validateAdminUser(readUser)).rejects.toBeTruthy();
  });
  test('success: extended user', () => {
    const extendedUser: RaitaUser = {
      uid: 'extended',
      roles: ['Raita_extended'],
    };
    expect(validateReadUser(extendedUser)).resolves.not.toThrow();
    expect(validateExtendedUser(extendedUser)).resolves.not.toThrow();
    expect(validateAdminUser(extendedUser)).rejects.toBeTruthy();
  });
  test('success: admin user', () => {
    const adminUser: RaitaUser = {
      uid: 'admin',
      roles: ['Raita_admin'],
    };
    expect(validateReadUser(adminUser)).resolves.not.toThrow();
    expect(validateExtendedUser(adminUser)).resolves.not.toThrow();
    expect(validateAdminUser(adminUser)).resolves.not.toThrow();
  });
});

describe('userService parse jwt roles ', () => {
  test('success: read user OAM', () => {
    //OAM "custom:rooli": "xxx_muokkaaja,Extranet_Kayttaja,yyy_konsultti,Raita_luku",
    const roles = parseRoles(
      'xxx_muokkaaja,Extranet_Kayttaja,yyy_konsultti,Raita_luku',
    );
    expect(roles).toContain('Raita_luku');
  });
  test('success: read user EntraID', () => {
    //EntraID: "custom:rooli" "[\"sovellus_role1\",\"sovellus_role2\"]"
    const input =
      '["xxx_muokkaaja","Extranet_Kayttaja","yyy_konsultti","Raita_luku"]';
    console.log(input);
    const roles = parseRoles(input);
    expect(roles).toContain('Raita_luku');
  });
  test('success: read user EntraID2', () => {
    //EntraID: "custom:rooli" "[\"sovellus_role1\",\"sovellus_role2\"]"
    const input =
      '[\\"xxx_muokkaaja\\",\\"Extranet_Kayttaja\\",\\"yyy_konsultti\\",\\"Raita_luku\\"]';
    console.log(input);
    const roles = parseRoles(input);
    expect(roles).toContain('Raita_luku');
  });
});
