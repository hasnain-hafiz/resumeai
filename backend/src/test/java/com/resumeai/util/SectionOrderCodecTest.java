package com.resumeai.util;

import com.resumeai.entity.Resume.SectionKey;
import com.resumeai.exception.InvalidReorderException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SectionOrderCodecTest {

    @Test
    void decode_splitsCommaSeparatedKeys() {
        List<String> keys = SectionOrderCodec.decode("EXPERIENCE,EDUCATION,PROJECTS");
        assertThat(keys).containsExactly("EXPERIENCE", "EDUCATION", "PROJECTS");
    }

    @Test
    void encode_joinsWithCommas() {
        assertThat(SectionOrderCodec.encode(List.of("SKILLS", "AWARDS"))).isEqualTo("SKILLS,AWARDS");
    }

    @Test
    void encodeThenDecode_roundTrips() {
        List<String> original = List.of("PROJECTS", "EXPERIENCE", "EDUCATION");
        assertThat(SectionOrderCodec.decode(SectionOrderCodec.encode(original))).isEqualTo(original);
    }

    @Test
    void defaultOrderCsv_containsEveryCanonicalSectionExactlyOnce() {
        List<String> decoded = SectionOrderCodec.decode(SectionKey.defaultOrderCsv());
        assertThat(decoded).hasSize(SectionKey.values().length);
        assertThat(decoded).doesNotHaveDuplicates();
    }

    @Test
    void validate_acceptsAFullPermutationOfCanonicalKeys() {
        List<String> shuffled = List.of(
            "CUSTOM_SECTIONS", "REFERENCES", "VOLUNTEER", "PUBLICATIONS", "AWARDS",
            "CERTIFICATIONS", "SKILLS", "PROJECTS", "EDUCATION", "EXPERIENCE"
        );
        // Should not throw.
        SectionOrderCodec.validate(shuffled);
    }

    @Test
    void validate_throwsWhenASectionIsMissing() {
        List<String> incomplete = SectionOrderCodec.decode(SectionKey.defaultOrderCsv()).subList(0, 5);
        assertThatThrownBy(() -> SectionOrderCodec.validate(incomplete)).isInstanceOf(InvalidReorderException.class);
    }

    @Test
    void validate_throwsWhenASectionIsDuplicated() {
        List<String> withDuplicate = new java.util.ArrayList<>(SectionOrderCodec.decode(SectionKey.defaultOrderCsv()));
        withDuplicate.remove(withDuplicate.size() - 1);
        withDuplicate.add("EXPERIENCE"); // duplicate, and now also missing CUSTOM_SECTIONS

        assertThatThrownBy(() -> SectionOrderCodec.validate(withDuplicate)).isInstanceOf(InvalidReorderException.class);
    }

    @Test
    void validate_throwsOnAnUnknownKey() {
        List<String> withUnknown = new java.util.ArrayList<>(SectionOrderCodec.decode(SectionKey.defaultOrderCsv()));
        withUnknown.set(0, "NOT_A_REAL_SECTION");

        assertThatThrownBy(() -> SectionOrderCodec.validate(withUnknown)).isInstanceOf(InvalidReorderException.class);
    }
}
